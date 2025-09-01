import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 解析提供商实体类
 * 用于存储解析站配置信息
 */
@Entity('parse_providers')
export class ParseProvider {
  @PrimaryGeneratedColumn()
  id: number; // 解析提供商ID，自增主键

  @Column({ length: 100 })
  name: string; // 解析提供商名称

  @Column({ length: 500 })
  baseUrl: string; // 解析站基础URL

  @Column({ type: 'text' })
  parseRule: string; // 解析规则（JSON格式的配置）

  @Column({ length: 500, nullable: true })
  apiUrl?: string; // API接口URL

  @Column({ length: 100, nullable: true })
  apiMethod?: string; // API请求方法（GET、POST等）

  @Column({ type: 'text', nullable: true })
  apiHeaders?: string; // API请求头（JSON格式）

  @Column({ length: 200, nullable: true })
  description?: string; // 解析提供商描述

  @Column({ default: true })
  isActive: boolean; // 是否可用

  @Column({ default: 0 })
  successRate: number; // 成功率（0-100）

  @Column({ default: 0 })
  requestCount: number; // 请求次数

  @Column({ default: 0 })
  successCount: number; // 成功次数

  @Column({ type: 'json', nullable: true })
  config: any; // 扩展配置

  @Column({ type: 'json', nullable: true })
  metadata?: any; // 扩展元数据

  @Column({ length: 50, nullable: true })
  category?: string; // 解析提供商分类

  @Column({ default: true })
  supportOnlinePlay: boolean; // 支持在线播放

  @Column({ default: true })
  supportDownload: boolean; // 支持下载链接

  @Column({ length: 20, nullable: true })
  priority?: string; // 优先级（high、medium、low）

  @Column({ type: 'date', nullable: true })
  expireDate?: Date; // 过期时间

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  @Column({ nullable: true })
  lastUsedAt?: Date; // 最后使用时间

  @Column({ nullable: true })
  lastCheckedAt?: Date; // 最后检查时间

  @Column({ default: 0 })
  dailyRequestLimit: number; // 每日请求限制（0表示无限制）

  @Column({ default: 0 })
  dailyRequestCount: number; // 今日已请求数

  @Column({ type: 'date', nullable: true })
  dailyResetDate?: Date; // 每日计数重置日期

  /**
   * 获取解析提供商完整信息
   */
  getProviderInfo(): any {
    return {
      id: this.id,
      name: this.name,
      baseUrl: this.baseUrl,
      apiUrl: this.apiUrl,
      apiMethod: this.apiMethod,
      description: this.description,
      isActive: this.isActive,
      successRate: this.successRate,
      requestCount: this.requestCount,
      successCount: this.successCount,
      category: this.category,
      supportOnlinePlay: this.supportOnlinePlay,
      supportDownload: this.supportDownload,
      priority: this.priority,
      config: this.config,
      metadata: this.metadata,
      dailyRequestLimit: this.dailyRequestLimit,
      dailyRequestCount: this.dailyRequestCount,
    };
  }

  /**
   * 检查是否可以发起请求
   */
  canMakeRequest(): boolean {
    if (!this.isActive) {
      return false;
    }

    // 检查每日请求限制
    if (this.dailyRequestLimit > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 如果是新的日期，重置计数器
      if (!this.dailyResetDate || this.dailyResetDate < today) {
        this.dailyRequestCount = 0;
        this.dailyResetDate = today;
        return true;
      }
      
      return this.dailyRequestCount < this.dailyRequestLimit;
    }

    return true;
  }

  /**
   * 更新请求统计
   */
  updateRequestStats(success: boolean): void {
    this.requestCount++;
    if (success) {
      this.successCount++;
    }
    
    // 重新计算成功率
    if (this.requestCount > 0) {
      this.successRate = Math.round((this.successCount / this.requestCount) * 100);
    }
    
    this.lastUsedAt = new Date();
    
    // 增加今日请求计数
    if (this.dailyRequestLimit > 0) {
      this.dailyRequestCount++;
    }
  }

  /**
   * 重置每日请求计数
   */
  resetDailyCount(): void {
    this.dailyRequestCount = 0;
    this.dailyResetDate = new Date();
  }

  /**
   * 获取解析配置
   */
  getParseConfig(): any {
    try {
      return JSON.parse(this.parseRule);
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取API请求头
   */
  getApiHeaders(): any {
    try {
      return this.apiHeaders ? JSON.parse(this.apiHeaders) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * 检查是否过期
   */
  isExpired(): boolean {
    if (!this.expireDate) {
      return false;
    }
    return this.expireDate < new Date();
  }
}