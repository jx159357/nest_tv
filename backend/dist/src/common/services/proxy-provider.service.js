"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ProxyProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyProviderService = exports.XiaoHuanProxyProvider = exports.Proxy89Provider = exports.XiciProxyProvider = exports.KuaiDailiFreeProvider = exports.BaseFreeProxyProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const app_logger_service_1 = require("./app-logger.service");
class BaseFreeProxyProvider {
    appLoggerService;
    timeout;
    httpClient;
    logger;
    appLogger;
    constructor(name, appLoggerService, timeout = 10000) {
        this.appLoggerService = appLoggerService;
        this.timeout = timeout;
        this.logger = new common_1.Logger(name);
        this.appLogger = appLoggerService;
        this.httpClient = axios_1.default.create({
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
    }
    parseProxyString(proxyStr, source) {
        try {
            const parts = proxyStr.trim().split(':');
            if (parts.length !== 2) {
                return null;
            }
            const host = parts[0];
            const port = parseInt(parts[1]);
            if (!this.isValidHost(host) || !this.isValidPort(port)) {
                return null;
            }
            return {
                id: `${source}_${host}_${port}`,
                host,
                port,
                protocol: 'http',
                source,
                addedAt: new Date(),
                isWorking: false,
                successCount: 0,
                failureCount: 0,
                totalRequests: 0,
                uptime: 0,
                tags: ['free'],
            };
        }
        catch (error) {
            return null;
        }
    }
    isValidHost(host) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipRegex.test(host);
    }
    isValidPort(port) {
        return port > 0 && port <= 65535;
    }
    generateId(host, port, source) {
        return `${source}_${host}_${port}_${Date.now()}`;
    }
}
exports.BaseFreeProxyProvider = BaseFreeProxyProvider;
let KuaiDailiFreeProvider = class KuaiDailiFreeProvider extends BaseFreeProxyProvider {
    name = 'KuaiDailiFree';
    isActive = true;
    priority = 1;
    constructor(appLoggerService) {
        super('KuaiDailiFree', appLoggerService);
    }
    async fetchProxies() {
        const proxies = [];
        try {
            const apiUrl = 'http://www.kuaidaili.com/free/inha/';
            const response = await this.httpClient.get(apiUrl);
            const proxyMatches = response.data.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || [];
            for (const proxyStr of proxyMatches) {
                const proxy = this.parseProxyString(proxyStr, this.name);
                if (proxy) {
                    proxies.push(proxy);
                }
            }
            this.logger.log(`从快代理获取 ${proxies.length} 个代理`);
        }
        catch (error) {
            this.appLogger.error('从快代理获取代理失败', 'KuaiDailiFreeProvider', error.message);
        }
        return proxies;
    }
};
exports.KuaiDailiFreeProvider = KuaiDailiFreeProvider;
exports.KuaiDailiFreeProvider = KuaiDailiFreeProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], KuaiDailiFreeProvider);
let XiciProxyProvider = class XiciProxyProvider extends BaseFreeProxyProvider {
    name = 'XiciProxy';
    isActive = true;
    priority = 2;
    constructor(appLoggerService) {
        super('XiciProxy', appLoggerService);
    }
    async fetchProxies() {
        const proxies = [];
        try {
            const apiUrl = 'https://www.xicidaili.com/nn/';
            const response = await this.httpClient.get(apiUrl, {
                headers: {
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                },
            });
            const proxyMatches = response.data.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || [];
            for (const proxyStr of proxyMatches) {
                const proxy = this.parseProxyString(proxyStr, this.name);
                if (proxy) {
                    proxies.push(proxy);
                }
            }
            this.logger.log(`从西刺代理获取 ${proxies.length} 个代理`);
        }
        catch (error) {
            this.appLogger.error('从西刺代理获取代理失败', 'XiciProxyProvider', error.message);
        }
        return proxies;
    }
};
exports.XiciProxyProvider = XiciProxyProvider;
exports.XiciProxyProvider = XiciProxyProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], XiciProxyProvider);
let Proxy89Provider = class Proxy89Provider extends BaseFreeProxyProvider {
    name = 'Proxy89';
    isActive = true;
    priority = 3;
    constructor(appLoggerService) {
        super('Proxy89', appLoggerService);
    }
    async fetchProxies() {
        const proxies = [];
        try {
            const apiUrl = 'https://www.89ip.cn/api/index?format=text';
            const response = await this.httpClient.get(apiUrl);
            const lines = response.data.split('\n').filter(line => line.trim());
            for (const line of lines) {
                const proxy = this.parseProxyString(line.trim(), this.name);
                if (proxy) {
                    proxies.push(proxy);
                }
            }
            this.logger.log(`从89IP获取 ${proxies.length} 个代理`);
        }
        catch (error) {
            this.appLogger.error('从89IP获取代理失败', 'Proxy89Provider', error.message);
        }
        return proxies;
    }
};
exports.Proxy89Provider = Proxy89Provider;
exports.Proxy89Provider = Proxy89Provider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], Proxy89Provider);
let XiaoHuanProxyProvider = class XiaoHuanProxyProvider extends BaseFreeProxyProvider {
    name = 'XiaoHuanProxy';
    isActive = true;
    priority = 4;
    constructor(appLoggerService) {
        super('XiaoHuanProxy', appLoggerService);
    }
    async fetchProxies() {
        const proxies = [];
        try {
            const apiUrl = 'https://ip.ihuan.me/api/proxy_ips';
            const response = await this.httpClient.get(apiUrl, {
                headers: {
                    Referer: 'https://ip.ihuan.me/',
                },
            });
            const data = response.data;
            if (data.data && Array.isArray(data.data.proxy)) {
                for (const item of data.data.proxy) {
                    const proxyStr = `${item.ip}:${item.port}`;
                    const proxy = this.parseProxyString(proxyStr, this.name);
                    if (proxy) {
                        proxy.country = item.country || '';
                        proxy.responseTime = item.speed || undefined;
                        proxies.push(proxy);
                    }
                }
            }
            this.logger.log(`从小幻代理获取 ${proxies.length} 个代理`);
        }
        catch (error) {
            this.appLogger.error('从小幻代理获取代理失败', 'XiaoHuanProxyProvider', error.message);
        }
        return proxies;
    }
};
exports.XiaoHuanProxyProvider = XiaoHuanProxyProvider;
exports.XiaoHuanProxyProvider = XiaoHuanProxyProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], XiaoHuanProxyProvider);
let ProxyProviderService = ProxyProviderService_1 = class ProxyProviderService {
    kuaiDailiProvider;
    xiciProvider;
    proxy89Provider;
    xiaoHuanProvider;
    logger = new common_1.Logger(ProxyProviderService_1.name);
    providers = new Map();
    constructor(kuaiDailiProvider, xiciProvider, proxy89Provider, xiaoHuanProvider) {
        this.kuaiDailiProvider = kuaiDailiProvider;
        this.xiciProvider = xiciProvider;
        this.proxy89Provider = proxy89Provider;
        this.xiaoHuanProvider = xiaoHuanProvider;
        this.initializeProviders();
    }
    initializeProviders() {
        this.providers.set(this.kuaiDailiProvider.name, this.kuaiDailiProvider);
        this.providers.set(this.xiciProvider.name, this.xiciProvider);
        this.providers.set(this.proxy89Provider.name, this.proxy89Provider);
        this.providers.set(this.xiaoHuanProvider.name, this.xiaoHuanProvider);
        this.logger.log(`初始化 ${this.providers.size} 个代理提供商`);
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    getActiveProviders() {
        return this.getAllProviders().filter(provider => provider.isActive);
    }
    getProvidersByPriority() {
        return this.getActiveProviders().sort((a, b) => a.priority - b.priority);
    }
    addProvider(provider) {
        this.providers.set(provider.name, provider);
        this.logger.log(`添加代理提供商: ${provider.name}`);
    }
    removeProvider(name) {
        const removed = this.providers.delete(name);
        if (removed) {
            this.logger.log(`移除代理提供商: ${name}`);
        }
        return removed;
    }
    toggleProvider(name, active) {
        const provider = this.providers.get(name);
        if (provider) {
            provider.isActive = active;
            this.logger.log(`${active ? '启用' : '禁用'}代理提供商: ${name}`);
            return true;
        }
        return false;
    }
    async fetchAllProxies() {
        const result = {};
        const activeProviders = this.getActiveProviders();
        for (const provider of activeProviders) {
            try {
                this.logger.log(`从 ${provider.name} 获取代理...`);
                const proxies = await provider.fetchProxies();
                result[provider.name] = proxies;
                this.logger.log(`从 ${provider.name} 获取到 ${proxies.length} 个代理`);
            }
            catch (error) {
                this.logger.error(`从 ${provider.name} 获取代理失败:`, error);
                result[provider.name] = [];
            }
        }
        return result;
    }
    getProviderStats() {
        return Array.from(this.providers.values()).map(provider => ({
            name: provider.name,
            active: provider.isActive,
            priority: provider.priority,
        }));
    }
};
exports.ProxyProviderService = ProxyProviderService;
exports.ProxyProviderService = ProxyProviderService = ProxyProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [KuaiDailiFreeProvider,
        XiciProxyProvider,
        Proxy89Provider,
        XiaoHuanProxyProvider])
], ProxyProviderService);
//# sourceMappingURL=proxy-provider.service.js.map