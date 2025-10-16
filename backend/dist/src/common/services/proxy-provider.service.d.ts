import { Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { ProxyProvider, ProxyInfo } from '../types/proxy-pool.types';
import { AppLoggerService } from './app-logger.service';
export declare abstract class BaseFreeProxyProvider implements ProxyProvider {
    protected appLoggerService: AppLoggerService;
    protected timeout: number;
    protected httpClient: AxiosInstance;
    protected logger: Logger;
    protected appLogger: AppLoggerService;
    constructor(name: string, appLoggerService: AppLoggerService, timeout?: number);
    abstract fetchProxies(): Promise<ProxyInfo[]>;
    abstract get name(): string;
    abstract get isActive(): boolean;
    abstract get priority(): number;
    protected parseProxyString(proxyStr: string, source: string): ProxyInfo | null;
    private isValidHost;
    private isValidPort;
    protected generateId(host: string, port: number, source: string): string;
}
export declare class KuaiDailiFreeProvider extends BaseFreeProxyProvider implements ProxyProvider {
    readonly name = "KuaiDailiFree";
    readonly isActive = true;
    readonly priority = 1;
    constructor(appLoggerService: AppLoggerService);
    fetchProxies(): Promise<ProxyInfo[]>;
}
export declare class XiciProxyProvider extends BaseFreeProxyProvider implements ProxyProvider {
    readonly name = "XiciProxy";
    readonly isActive = true;
    readonly priority = 2;
    constructor(appLoggerService: AppLoggerService);
    fetchProxies(): Promise<ProxyInfo[]>;
}
export declare class Proxy89Provider extends BaseFreeProxyProvider implements ProxyProvider {
    readonly name = "Proxy89";
    readonly isActive = true;
    readonly priority = 3;
    constructor(appLoggerService: AppLoggerService);
    fetchProxies(): Promise<ProxyInfo[]>;
}
export declare class XiaoHuanProxyProvider extends BaseFreeProxyProvider implements ProxyProvider {
    readonly name = "XiaoHuanProxy";
    readonly isActive = true;
    readonly priority = 4;
    constructor(appLoggerService: AppLoggerService);
    fetchProxies(): Promise<ProxyInfo[]>;
}
export declare class ProxyProviderService {
    private readonly kuaiDailiProvider;
    private readonly xiciProvider;
    private readonly proxy89Provider;
    private readonly xiaoHuanProvider;
    private readonly logger;
    private providers;
    constructor(kuaiDailiProvider: KuaiDailiFreeProvider, xiciProvider: XiciProxyProvider, proxy89Provider: Proxy89Provider, xiaoHuanProvider: XiaoHuanProxyProvider);
    private initializeProviders;
    getAllProviders(): ProxyProvider[];
    getActiveProviders(): ProxyProvider[];
    getProvidersByPriority(): ProxyProvider[];
    addProvider(provider: ProxyProvider): void;
    removeProvider(name: string): boolean;
    toggleProvider(name: string, active: boolean): boolean;
    fetchAllProxies(): Promise<{
        [provider: string]: ProxyInfo[];
    }>;
    getProviderStats(): {
        name: string;
        active: boolean;
        priority: number;
    }[];
}
