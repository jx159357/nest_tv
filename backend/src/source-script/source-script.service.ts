import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as vm from 'vm';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { SourceScript } from '../entities/source-script.entity';

export type ScriptHook = 'getSources' | 'search' | 'recommend' | 'detail' | 'resolvePlayUrl';

interface ScriptMeta {
  key: string;
  name: string;
  version?: string;
  description?: string;
  sources?: { id: string; name: string }[];
}

interface ScriptModule {
  meta: ScriptMeta;
  getSources?: (ctx: ScriptContext) => Promise<unknown>;
  search?: (ctx: ScriptContext, keyword: string, page?: number) => Promise<unknown>;
  recommend?: (ctx: ScriptContext, sourceId?: string) => Promise<unknown>;
  detail?: (ctx: ScriptContext, id: string, sourceId?: string) => Promise<unknown>;
  resolvePlayUrl?: (
    ctx: ScriptContext,
    url: string,
    sourceId?: string,
    episodeIndex?: number,
  ) => Promise<unknown>;
}

interface ScriptContext {
  fetch: import('axios').AxiosInstance;
  request: {
    get: (url: string, config?: unknown) => Promise<unknown>;
    post: (url: string, data?: unknown, config?: unknown) => Promise<unknown>;
    getJson: <T = unknown>(url: string) => Promise<T>;
    getHtml: (url: string) => Promise<string>;
  };
  html: {
    load: typeof cheerio.load;
  };
  cache: {
    get: <T = unknown>(key: string) => T | undefined;
    set: <T = unknown>(key: string, value: T, ttlMs?: number) => void;
    del: (key: string) => void;
  };
  log: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  utils: {
    buildUrl: (base: string, path: string, params?: Record<string, string>) => string;
    base64Encode: (str: string) => string;
    base64Decode: (str: string) => string;
    sleep: (ms: number) => Promise<void>;
    randomUA: () => string;
  };
  config: {
    get: (key: string) => string | undefined;
    require: (key: string) => string;
    all: () => Record<string, string>;
  };
  runtime: {
    scriptId: number;
    scriptKey: string;
    scriptName: string;
    scriptVersion: string;
  };
}

export interface ScriptTestResult {
  ok: boolean;
  duration: number;
  logs: string[];
  meta?: ScriptMeta;
  result?: unknown;
  error?: string;
}

const EXECUTION_TIMEOUT = 20_000;
const COMPILE_CACHE_MAX = 50;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

@Injectable()
export class SourceScriptService {
  private readonly logger = new Logger(SourceScriptService.name);

  private compileCache = new Map<
    string,
    { version: string; factory: (require: NodeRequire) => ScriptModule }
  >();

  private scriptCache = new Map<number, { version: string; module: ScriptModule }>();

  constructor(
    @InjectRepository(SourceScript)
    private readonly repo: Repository<SourceScript>,
  ) {}

  // ── CRUD ──

  async findAll(): Promise<SourceScript[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<SourceScript | null> {
    return this.repo.findOneBy({ id });
  }

  async findByKey(key: string): Promise<SourceScript | null> {
    return this.repo.findOneBy({ key });
  }

  async save(record: Partial<SourceScript>): Promise<SourceScript> {
    if (record.id) {
      await this.repo.update(record.id, record as any);
      const updated = await this.repo.findOneBy({ id: record.id });
      this.invalidateCache(record.id);
      return updated!;
    }
    const entity = this.repo.create(record);
    const saved = await this.repo.save(entity);
    return saved;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
    this.invalidateCache(id);
  }

  async toggleEnabled(id: number): Promise<SourceScript> {
    const script = await this.repo.findOneBy({ id });
    if (!script) throw new Error(`Script ${id} not found`);
    script.enabled = !script.enabled;
    await this.repo.save(script);
    this.invalidateCache(id);
    return script;
  }

  async updateStats(id: number, success: boolean, error?: string): Promise<void> {
    await this.repo.update(id, {
      lastUsedAt: new Date(),
      ...(error ? { lastErrorAt: new Date(), lastError: error.slice(0, 1000) } : {}),
    });
    await this.repo.increment({ id }, 'requestCount', 1);
    if (!success) {
      await this.repo.increment({ id }, 'errorCount', 1);
    }
  }

  // ── Compilation & Execution ──

  private compileScript(code: string, version: string): (require: NodeRequire) => ScriptModule {
    const cacheKey = this.hashCode(code);
    const cached = this.compileCache.get(cacheKey);
    if (cached && cached.version === version) return cached.factory;

    const wrappedCode = `"use strict"; return (${code});`;
    const factory = vm.compileFunction(wrappedCode, ['require']) as (
      require: NodeRequire,
    ) => ScriptModule;

    if (this.compileCache.size >= COMPILE_CACHE_MAX) {
      const firstKey = this.compileCache.keys().next().value;
      if (firstKey) this.compileCache.delete(firstKey);
    }
    this.compileCache.set(cacheKey, { version, factory });
    return factory;
  }

  private getScriptModule(script: SourceScript): ScriptModule {
    const cached = this.scriptCache.get(script.id);
    if (cached && cached.version === script.version) return cached.module;

    const factory = this.compileScript(script.code, script.version || '');
    const mod = factory(require);

    if (!mod || typeof mod !== 'object' || !mod.meta) {
      throw new Error('Script must export an object with a meta property');
    }

    this.scriptCache.set(script.id, { version: script.version || '', module: mod });
    return mod;
  }

  private invalidateCache(id: number): void {
    this.scriptCache.delete(id);
  }

  private hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash * 31 + char) | 0;
    }
    return hash.toString(36);
  }

  createContext(script: SourceScript): ScriptContext {
    const logs: string[] = [];
    const cacheStore = new Map<string, { value: unknown; expires: number }>();
    const configMap: Record<string, string> = script.config || {};

    const safeFetch = axios.create({
      timeout: 15_000,
      maxRedirects: 5,
      headers: { 'User-Agent': USER_AGENTS[0] },
      validateStatus: () => true,
    });

    const safeRequest = {
      get: (url: string, config?: unknown) => {
        this.validateUrl(url);
        return safeFetch.get(url, config as any).then(r => r.data);
      },
      post: (url: string, data?: unknown, config?: unknown) => {
        this.validateUrl(url);
        return safeFetch.post(url, data, config as any).then(r => r.data);
      },
      getJson: <T = unknown>(url: string): Promise<T> => {
        this.validateUrl(url);
        return safeFetch.get(url).then(r => r.data as T);
      },
      getHtml: (url: string): Promise<string> => {
        this.validateUrl(url);
        return safeFetch.get(url).then(r => String(r.data));
      },
    };

    const ctx: ScriptContext = {
      fetch: safeFetch,
      request: safeRequest,
      html: { load: cheerio.load },
      cache: {
        get: <T>(key: string): T | undefined => {
          const entry = cacheStore.get(key);
          if (!entry) return undefined;
          if (Date.now() > entry.expires) {
            cacheStore.delete(key);
            return undefined;
          }
          return entry.value as T;
        },
        set: <T>(key: string, value: T, ttlMs = 300_000) => {
          cacheStore.set(key, { value, expires: Date.now() + ttlMs });
        },
        del: (key: string) => cacheStore.delete(key),
      },
      log: {
        info: (...args: unknown[]) => logs.push(`[INFO] ${args.join(' ')}`),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(' ')}`),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(' ')}`),
      },
      utils: {
        buildUrl: (base: string, path: string, params?: Record<string, string>) => {
          const url = new URL(path, base);
          if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
          return url.toString();
        },
        base64Encode: (str: string) => Buffer.from(str).toString('base64'),
        base64Decode: (str: string) => Buffer.from(str, 'base64').toString('utf-8'),
        sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000))),
        randomUA: () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      },
      config: {
        get: (key: string) => configMap[key],
        require: (key: string) => {
          const val = configMap[key];
          if (!val) throw new Error(`Missing required config: ${key}`);
          return val;
        },
        all: () => ({ ...configMap }),
      },
      runtime: {
        scriptId: script.id,
        scriptKey: script.key,
        scriptName: script.name,
        scriptVersion: script.version || '',
      },
    };

    Object.freeze(ctx.log);
    Object.freeze(ctx.cache);
    Object.freeze(ctx.utils);
    Object.freeze(ctx.config);
    Object.freeze(ctx.runtime);

    return ctx;
  }

  async executeHook<T = unknown>(
    script: SourceScript,
    hook: ScriptHook,
    args: unknown[] = [],
  ): Promise<{ result: T; duration: number; logs: string[] }> {
    const mod = this.getScriptModule(script);
    const fn = mod[hook];
    if (typeof fn !== 'function') {
      throw new Error(`Script does not implement hook: ${hook}`);
    }

    const ctx = this.createContext(script);
    const start = Date.now();

    const result = await Promise.race([
      (fn as Function)(ctx, ...args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Script execution timeout')), EXECUTION_TIMEOUT),
      ),
    ]);

    return { result: result as T, duration: Date.now() - start, logs: [] };
  }

  async testScript(code: string, config?: Record<string, string>): Promise<ScriptTestResult> {
    const logs: string[] = [];
    const start = Date.now();

    try {
      const factory = this.compileScript(code, 'test');
      const mod = factory(require);

      if (!mod || typeof mod !== 'object' || !mod.meta) {
        return {
          ok: false,
          duration: Date.now() - start,
          logs,
          error: 'Script must export an object with meta',
        };
      }

      const mockScript: SourceScript = {
        id: 0,
        key: mod.meta.key || 'test',
        name: mod.meta.name || 'Test',
        code,
        enabled: true,
        config: config || null,
        version: mod.meta.version || 'test',
        requestCount: 0,
        errorCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ctx = this.createContext(mockScript);
      ctx.log.info = (...args: unknown[]) => logs.push(`[INFO] ${args.join(' ')}`);
      ctx.log.warn = (...args: unknown[]) => logs.push(`[WARN] ${args.join(' ')}`);
      ctx.log.error = (...args: unknown[]) => logs.push(`[ERROR] ${args.join(' ')}`);

      let result: unknown;
      if (typeof mod.getSources === 'function') {
        result = await Promise.race([
          mod.getSources(ctx),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), EXECUTION_TIMEOUT),
          ),
        ]);
      }

      return {
        ok: true,
        duration: Date.now() - start,
        logs,
        meta: mod.meta,
        result,
      };
    } catch (err) {
      return {
        ok: false,
        duration: Date.now() - start,
        logs,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async executeHookById<T = unknown>(
    id: number,
    hook: ScriptHook,
    args: unknown[] = [],
  ): Promise<{ result: T; duration: number; logs: string[] }> {
    const script = await this.repo.findOneBy({ id, enabled: true });
    if (!script) throw new Error(`Script ${id} not found or disabled`);

    try {
      const res = await this.executeHook<T>(script, hook, args);
      await this.updateStats(id, true);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.updateStats(id, false, msg);
      throw err;
    }
  }

  async executeHookByKey<T = unknown>(
    key: string,
    hook: ScriptHook,
    args: unknown[] = [],
  ): Promise<{ result: T; duration: number; logs: string[] }> {
    const script = await this.repo.findOneBy({ key, enabled: true });
    if (!script) throw new Error(`Script "${key}" not found or disabled`);

    try {
      const res = await this.executeHook<T>(script, hook, args);
      await this.updateStats(script.id, true);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.updateStats(script.id, false, msg);
      throw err;
    }
  }

  async searchWithScript(
    key: string,
    keyword: string,
    page = 1,
    sourceId?: string,
  ): Promise<unknown> {
    const { result } = await this.executeHookByKey(key, 'search', [keyword, page, sourceId]);
    return result;
  }

  async getDetailWithScript(key: string, id: string, sourceId?: string): Promise<unknown> {
    const { result } = await this.executeHookByKey(key, 'detail', [id, sourceId]);
    return result;
  }

  async resolvePlayUrlWithScript(
    key: string,
    url: string,
    sourceId?: string,
    episodeIndex?: number,
  ): Promise<unknown> {
    const { result } = await this.executeHookByKey(key, 'resolvePlayUrl', [
      url,
      sourceId,
      episodeIndex,
    ]);
    return result;
  }

  private validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Blocked non-HTTP(S) URL: ${url}`);
      }
    } catch (err) {
      if (err instanceof TypeError) throw new Error(`Invalid URL: ${url}`);
      throw err;
    }
  }

  getTemplate(): string {
    return `{
  meta: {
    key: 'my-source',
    name: 'My Custom Source',
    version: '1.0.0',
    description: 'A custom video source script',
    sources: [
      { id: 'source1', name: 'Source 1' },
    ],
  },

  async getSources(ctx) {
    return this.meta.sources;
  },

  async search(ctx, keyword, page = 1) {
    // ctx.request.getHtml(url) - fetch HTML
    // ctx.html.load(html) - parse with cheerio
    // ctx.cache.set/get - caching
    // Return: { list: [{ id, title, poster, year }], totalPages }
    return { list: [], totalPages: 0 };
  },

  async recommend(ctx, sourceId) {
    // Return recommended items
    return { list: [] };
  },

  async detail(ctx, id, sourceId) {
    // Return: { id, title, poster, episodes: [{ name, url }] }
    return { id, title: '', episodes: [] };
  },

  async resolvePlayUrl(ctx, url, sourceId, episodeIndex) {
    // Resolve the actual playable URL
    // Return: { url, headers?, type? }
    return { url };
  },
}`;
  }
}
