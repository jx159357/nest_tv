/**
 * 资源缓存管理器
 */

// 缓存配置
export interface CacheConfig {
  name: string
  maxSize: number // 最大缓存条目数
  ttl: number // 生存时间（毫秒）
  storageType: 'memory' | 'local' | 'session' // 存储类型
  compression?: boolean // 是否压缩数据
  cleanupInterval?: number // 清理间隔（毫秒）
}

// 缓存条目
export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccess: number
  size: number
}

// 缓存统计
export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
  hitRate: number
  entries: number
  memoryUsage: number
}

export class ResourceCache<T = any> {
  private config: CacheConfig
  private cache: Map<string, CacheEntry<T>>
  private stats: CacheStats
  private cleanupTimer?: NodeJS.Timeout
  private changeListeners: Map<string, ((key: string, value: T | null) => void)> = new Map()
  
  constructor(config: CacheConfig) {
    this.config = {
      cleanupInterval: 60000, // 默认1分钟清理一次
      compression: false,
      ...config,
    }
    
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
      entries: 0,
      memoryUsage: 0,
    }
    
    this.loadFromStorage()
    this.startCleanup()
  }
  
  // 设置缓存
  set(key: string, value: T, ttl?: number): void {
    const size = this.calculateSize(value)
    
    // 如果缓存已满，清理空间
    if (this.cache.size >= this.config.maxSize) {
      this.evict()
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      accessCount: 0,
      lastAccess: Date.now(),
      size,
    }
    
    this.cache.set(key, entry)
    this.updateStats('set', size)
    this.saveToStorage()
    this.notifyChange(key, value)
  }
  
  // 获取缓存
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.updateStats('miss')
      return null
    }
    
    // 检查是否过期
    if (this.isExpired(entry)) {
      this.delete(key)
      this.updateStats('miss')
      return null
    }
    
    // 更新访问信息
    entry.accessCount++
    entry.lastAccess = Date.now()
    
    this.updateStats('hit')
    this.notifyChange(key, entry.value)
    
    return entry.value
  }
  
  // 检查缓存是否存在
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }
  
  // 删除缓存
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats('delete')
      this.saveToStorage()
      this.notifyChange(key, null)
    }
    return deleted
  }
  
  // 清空缓存
  clear(): void {
    this.cache.forEach((entry, key) => {
      this.notifyChange(key, null)
    })
    this.cache.clear()
    this.stats.entries = 0
    this.stats.size = 0
    this.stats.memoryUsage = 0
    this.saveToStorage()
  }
  
  // 获取所有键
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  // 获取所有值
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }
  
  // 获取所有条目
  entries(): Array<{ key: string; value: T }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
    }))
  }
  
  // 获取缓存大小
  size(): number {
    return this.cache.size
  }
  
  // 获取缓存统计信息
  getStats(): CacheStats {
    return { ...this.stats }
  }
  
  // 批量获取
  batchGet(keys: string[]): (T | null)[] {
    return keys.map(key => this.get(key))
  }
  
  // 批量设置
  batchSet(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl)
    })
  }
  
  // 模糊匹配获取
  getFuzzy(pattern: string, limit = 5): Array<{ key: string; value: T }> {
    const results: Array<{ key: string; value: T; score: number }> = []
    
    this.cache.forEach((entry, key) => {
      const score = this.calculateFuzzyScore(key, pattern)
      if (score > 0.5) { // 0.5 是模糊匹配的阈值
        results.push({ key, value: entry.value, score })
      }
    })
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ key, value }) => ({ key, value }))
  }
  
  // 添加变化监听器
  onChange(key: string, callback: (key: string, value: T | null) => void): void {
    this.changeListeners.set(key, callback)
  }
  
  // 移除变化监听器
  offChange(key: string): void {
    this.changeListeners.delete(key)
  }
  
  // 清理过期缓存
  cleanup(): number {
    let count = 0
    const now = Date.now()
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.delete(key)
        count++
      }
    })
    
    return count
  }
  
  // 清理最久未使用的缓存
  cleanupLRU(count = Math.ceil(this.config.maxSize * 0.2)): number {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccess - b.entry.lastAccess)
    
    let deletedCount = 0
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const { key } = entries[i]
      if (this.delete(key)) {
        deletedCount++
      }
    }
    
    return deletedCount
  }
  
  // 清理最少使用的缓存
  cleanupLFU(count = Math.ceil(this.config.maxSize * 0.2)): number {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.accessCount - b.entry.accessCount)
    
    let deletedCount = 0
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const { key } = entries[i]
      if (this.delete(key)) {
        deletedCount++
      }
    }
    
    return deletedCount
  }
  
  // 序列化缓存到存储
  private saveToStorage(): void {
    if (this.config.storageType === 'memory') return
    
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      }
      
      let serialized = JSON.stringify(data)
      
      // 压缩数据
      if (this.config.compression) {
        // 这里可以添加压缩逻辑
        // serialized = compress(serialized)
      }
      
      if (this.config.storageType === 'local') {
        localStorage.setItem(`cache_${this.config.name}`, serialized)
      } else if (this.config.storageType === 'session') {
        sessionStorage.setItem(`cache_${this.config.name}`, serialized)
      }
    } catch (error) {
      console.warn(`Failed to save cache ${this.config.name} to storage:`, error)
    }
  }
  
  // 从存储加载缓存
  private loadFromStorage(): void {
    if (this.config.storageType === 'memory') return
    
    try {
      let serialized: string | null = null
      
      if (this.config.storageType === 'local') {
        serialized = localStorage.getItem(`cache_${this.config.name}`)
      } else if (this.config.storageType === 'session') {
        serialized = sessionStorage.getItem(`cache_${this.config.name}`)
      }
      
      if (!serialized) return
      
      // 解压缩数据
      if (this.config.compression) {
        // 这里可以添加解压缩逻辑
        // serialized = decompress(serialized)
      }
      
      const data = JSON.parse(serialized)
      
      // 重构缓存
      this.cache = new Map(data.cache || [])
      
      // 更新统计
      if (data.stats) {
        this.stats = { ...data.stats, maxSize: this.config.maxSize }
      }
      
      // 清理过期条目
      this.cleanup()
    } catch (error) {
      console.warn(`Failed to load cache ${this.config.name} from storage:`, error)
    }
  }
  
  // 开始自动清理
  private startCleanup(): void {
    if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        const cleaned = this.cleanup()
        if (cleaned > 0) {
          console.log(`Cache ${this.config.name}: cleaned ${cleaned} expired entries`)
        }
      }, this.config.cleanupInterval)
    }
  }
  
  // 停止自动清理
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }
  
  // 淘汰缓存
  private evict(): void {
    // 优先清理过期的
    if (this.cleanup() > 0) {
      return
    }
    
    // 使用LRU策略
    this.cleanupLRU(1)
    
    this.stats.evictions++
  }
  
  // 检查缓存是否过期
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }
  
  // 计算数据大小
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2 // 简单估算，2字节每字符
    } catch {
      return 1024 // 默认1KB
    }
  }
  
  // 计算模糊匹配分数
  private calculateFuzzyScore(key: string, pattern: string): number {
    if (!key || !pattern) return 0
    
    // 简单的包含匹配
    if (key.includes(pattern)) return 1.0
    
    // 模糊匹配逻辑
    const patternLower = pattern.toLowerCase()
    const keyLower = key.toLowerCase()
    
    if (patternLower === keyLower) return 1.0
    
    // 部分匹配
    let score = 0
    let patternIndex = 0
    let keyIndex = 0
    
    while (patternIndex < patternLower.length && keyIndex < keyLower.length) {
      if (patternLower[patternIndex] === keyLower[keyIndex]) {
        score++
        patternIndex++
      } else {
        score *= 0.9
        keyIndex++
      }
    }
    
    return score / Math.max(patternLower.length, keyLower.length)
  }
  
  // 更新统计信息
  private updateStats(action: 'hit' | 'miss' | 'set' | 'delete', size = 0): void {
    switch (action) {
      case 'hit':
        this.stats.hits++
        break
      case 'miss':
        this.stats.misses++
        break
      case 'set':
        this.stats.entries = this.cache.size
        this.stats.size += size
        break
      case 'delete':
        this.stats.entries = this.cache.size
        this.stats.size = Math.max(0, this.stats.size - size)
        break
    }
    
    // 计算命中率
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    
    // 估算内存使用
    this.stats.memoryUsage = this.stats.size
  }
  
  // 通知变化
  private notifyChange(key: string, value: T | null): void {
    const callback = this.changeListeners.get(key)
    if (callback) {
      try {
        callback(key, value)
      } catch (error) {
        console.error(`Cache change listener error for key ${key}:`, error)
      }
    }
  }
  
  // 销毁缓存
  destroy(): void {
    this.stopCleanup()
    this.clear()
    this.changeListeners.clear()
  }
}

// 创建预配置的缓存实例
export const createCache = <T = any>(config: CacheConfig) => new ResourceCache<T>(config)

// 默认配置
export const DEFAULT_CACHE_CONFIG: Partial<CacheConfig> = {
  maxSize: 100,
  ttl: 300000, // 5分钟
  storageType: 'memory',
  compression: false,
  cleanupInterval: 60000,
}

// 创建默认缓存
export const createDefaultCache = <T = any>(name: string, overrides?: Partial<CacheConfig>) => {
  return createCache<T>({
    name,
    ...DEFAULT_CACHE_CONFIG,
    ...overrides,
  })
}

// 全局缓存实例
export const globalCache = createDefaultCache('global', {
  maxSize: 500,
  ttl: 1800000, // 30分钟
})

// API缓存实例
export const apiCache = createDefaultCache('api', {
  maxSize: 1000,
  ttl: 300000, // 5分钟
  storageType: 'session',
})

// 图片缓存实例
export const imageCache = createDefaultCache('images', {
  maxSize: 200,
  ttl: 3600000, // 1小时
  storageType: 'local',
  compression: true,
})

// 组件缓存实例
export const componentCache = createDefaultCache('components', {
  maxSize: 50,
  ttl: 600000, // 10分钟
  storageType: 'memory',
})

// 导出缓存工具函数
export const cacheUtils = {
  // 创建缓存键
  createKey: (namespace: string, ...parts: string[]): string => {
    return `${namespace}:${parts.join(':')}`
  },
  
  // 创建带有版本控制的缓存键
  createVersionedKey: (namespace: string, version: string, ...parts: string[]): string => {
    return `${namespace}:${version}:${parts.join(':')}`
  },
  
  // 创建带有时间戳的缓存键
  createTimestampKey: (namespace: string, timestamp: number, ...parts: string[]): string => {
    return `${namespace}:${timestamp}:${parts.join(':')}`
  },
  
  // 计算缓存大小
  calculateCacheSize: (cache: ResourceCache): number => {
    const stats = cache.getStats()
    return stats.size
  },
  
  // 清理所有缓存
  clearAllCaches: () => {
    globalCache.clear()
    apiCache.clear()
    imageCache.clear()
    componentCache.clear()
  },
  
  // 获取所有缓存的统计信息
  getAllCacheStats: () => ({
    global: globalCache.getStats(),
    api: apiCache.getStats(),
    images: imageCache.getStats(),
    components: componentCache.getStats(),
  }),
  
  // 优化缓存配置
  optimizeConfig: (config: CacheConfig, memoryInfo?: { used: number; total: number }): CacheConfig => {
    if (!memoryInfo) return config
    
    const memoryUsagePercent = memoryInfo.used / memoryInfo.total
    
    // 如果内存使用超过80%，减少缓存大小
    if (memoryUsagePercent > 0.8) {
      config.maxSize = Math.floor(config.maxSize * 0.7)
      config.cleanupInterval = Math.max(10000, config.cleanupInterval * 0.8)
    }
    // 如果内存使用小于50%，可以增加缓存大小
    else if (memoryUsagePercent < 0.5) {
      config.maxSize = Math.floor(config.maxSize * 1.2)
    }
    
    return config
  },
}

// 导出缓存类型
export type { CacheConfig, CacheEntry, CacheStats }