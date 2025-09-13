import { CacheableOptions, CacheEvictOptions } from '../cache/cache.service';
export declare const Cacheable: (options?: CacheableOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const CacheEvict: (options?: CacheEvictOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const CacheRefresh: (options?: CacheableOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
