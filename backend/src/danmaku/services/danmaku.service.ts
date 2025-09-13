import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, Like } from 'typeorm'
import { Danmaku } from '../entities/danmaku.entity'
import { MediaResource } from '../../entities/media-resource.entity'
import { User } from '../../entities/user.entity'

export interface CreateDanmakuDto {
  text: string
  color?: string
  type?: 'scroll' | 'top' | 'bottom'
  priority?: number
}

export interface DanmakuQueryDto {
  videoId?: string
  mediaResourceId?: number
  userId?: number
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
  isActive?: boolean
  sort?: 'ASC' | 'DESC'
  sortBy?: 'createdAt' | 'priority' | 'id'
}

export interface DanmakuFilterDto {
  text?: string
  videoId?: string
  mediaResourceId?: number
  userId?: number
  color?: string
  type?: string
  priority?: number
  isHighlighted?: boolean
  isActive?: boolean
  dateRange?: {
    start?: Date
    end?: Date
  }
  customFilters?: {
    containsSensitive?: boolean
    containsSpam?: boolean
    containsEmojis?: boolean
  }
}

@Injectable()
export class DanmakuService {
  private readonly logger = new Logger(DanmakuService.name)

  constructor(
    @InjectRepository(Danmaku)
    private readonly danmakuRepository: Repository<Danmaku>,
    private readonly dataSource: DataSource,
  ) {}

  // 创建弹幕
  async create(createDto: CreateDanmakuDto, userId: number, mediaResourceId: number, videoId: string): Promise<Danmaku> {
    const danmaku = this.danmakuRepository.create({
      danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: this.filterText(createDto.text),
      color: createDto.color || '#FFFFFF',
      type: createDto.type || 'scroll',
      priority: createDto.priority || 1,
      isHighlighted: false,
      isActive: true,
      filters: this.analyzeContent(createDto.text),
      metadata: {
        timestamp: Date.now(),
        userAgent: 'server-generated'
      },
      userId,
      mediaResourceId,
      videoId,
    })

    return await this.danmakuRepository.save(danmaku)
  }

  // 批量创建弹幕（用于导入）
  async createBulk(createDtos: CreateDanmakuDto[], userId: number): Promise<Danmaku[]> {
    const danmakuEntities = createDtos.map(dto => ({
      danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: this.filterText(dto.text),
      color: dto.color || '#FFFFFF',
      type: dto.type || 'scroll',
      priority: dto.priority || 1,
      isHighlighted: false,
      isActive: true,
      filters: this.analyzeContent(dto.text),
      metadata: {
        timestamp: Date.now(),
        userAgent: 'bulk-import'
      },
      userId,
      // 需要从dto中提取mediaResourceId和videoId
      mediaResourceId: 0, // 临时值
      videoId: '', // 临时值
    }))

    return await this.danmakuRepository.save(danmakuEntities)
  }

  // 查询弹幕
  async findAll(queryDto: DanmakuQueryDto = {}): Promise<{ data: Danmaku[]; total: number }> {
    const {
      videoId,
      mediaResourceId,
      userId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      isActive = true,
      sort = 'DESC',
      sortBy = 'createdAt'
    } = queryDto

    const queryBuilder = this.danmakuRepository.createQueryBuilder('danmaku')
      .leftJoinAndSelect('danmaku.user', 'user')
      .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource')

    // 条件过滤
    if (videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId })
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId })
    }

    if (userId) {
      queryBuilder.andWhere('danmaku.userId = :userId', { userId })
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive })
    }

    // 日期范围过滤
    if (startDate && endDate) {
      queryBuilder.andWhere('danmaku.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
    } else if (startDate) {
      queryBuilder.andWhere('danmaku.createdAt >= :startDate', { startDate })
    } else if (endDate) {
      queryBuilder.andWhere('danmaku.createdAt <= :endDate', { endDate })
    }

    // 排序和分页
    queryBuilder
      .orderBy(`danmaku.${sortBy}`, sort)
      .skip(offset)
      .take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return { data, total }
  }

  // 高级搜索
  async search(filters: DanmakuFilterDto, queryDto: DanmakuQueryDto = {}): Promise<{ data: Danmaku[]; total: number }> {
    const queryBuilder = this.danmakuRepository.createQueryBuilder('danmaku')
      .leftJoinAndSelect('danmaku.user', 'user')
      .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource')

    // 应用基础查询条件
    this.applyFilters(queryBuilder, filters)

    // 应用查询参数
    this.applyQueryParams(queryBuilder, queryDto)

    const [data, total] = await queryBuilder.getManyAndCount()

    return { data, total }
  }

  // 根据ID查找弹幕
  async findById(id: number): Promise<Danmaku | null> {
    return await this.danmakuRepository.findOne({
      where: { id },
      relations: ['user', 'mediaResource']
    })
  }

  // 更新弹幕
  async update(id: number, updateDto: Partial<CreateDanmakuDto>): Promise<Danmaku | null> {
    const danmaku = await this.findById(id)
    if (!danmaku) {
      this.logger.warn(`弹幕未找到: ${id}`)
      return null
    }

    // 如果更新文本，重新分析内容
    if (updateDto.text) {
      updateDto.text = this.filterText(updateDto.text)
      danmaku.filters = this.analyzeContent(updateDto.text)
    }

    Object.assign(danmaku, updateDto)

    return await this.danmakuRepository.save(danmaku)
  }

  // 删除弹幕（软删除）
  async delete(id: number, userId?: number): Promise<boolean> {
    const danmaku = await this.findById(id)
    if (!danmaku) {
      this.logger.warn(`弹幕未找到: ${id}`)
      return false
    }

    // 权限检查：只有发送者或管理员可以删除
    if (userId && danmaku.userId !== userId) {
      this.logger.warn(`用户 ${userId} 无权限删除弹幕 ${id}`)
      return false
    }

    danmaku.isActive = false
    await this.danmakuRepository.save(danmaku)

    return true
  }

  // 硬删除
  async hardDelete(id: number): Promise<boolean> {
    const result = await this.danmakuRepository.delete(id)
    return (result.affected || 0) > 0
  }

  // 清理过期弹幕
  async cleanExpired(daysOld = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await this.danmakuRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isActive = false') // 只删除已停用的过期弹幕
      .execute()

    return result.affected || 0
  }

  // 获取热门弹幕
  async getPopularDanmaku(limit = 50): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { isActive: true },
      order: {
        createdAt: 'DESC'
      },
      take: limit,
      relations: ['user', 'mediaResource']
    })
  }

  // 获取用户弹幕历史
  async getUserDanmaku(userId: number, limit = 50, offset = 0): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { userId, isActive: true },
      order: {
        createdAt: 'DESC'
      },
      skip: offset,
      take: limit,
      relations: ['mediaResource']
    })
  }

  // 获取媒体资源弹幕
  async getMediaDanmaku(mediaResourceId: number, limit = 100, offset = 0): Promise<Danmaku[]> {
    return await this.danmakuRepository.find({
      where: { mediaResourceId, isActive: true },
      order: {
        createdAt: 'ASC' // 按时间正序排列，用于播放时显示
      },
      skip: offset,
      take: limit,
      relations: ['user']
    })
  }

  // 统计弹幕数量
  async getDanmakuStats(videoId?: string): Promise<any> {
    const queryBuilder = this.danmakuRepository
      .createQueryBuilder('danmaku')
      .select([
        'COUNT(DISTINCT userId) as uniqueUsers',
        'COUNT(*) as totalDanmaku',
        'COUNT(CASE WHEN type = :scroll THEN 1 END) as scrollDanmaku',
        'COUNT(CASE WHEN type = :top THEN 1 END) as topDanmaku',
        'COUNT(CASE WHEN type = :bottom THEN 1 END) as bottomDanmaku',
        'COUNT(CASE WHEN isHighlighted = true THEN 1 END) as highlightedDanmaku',
        'COUNT(CASE WHEN isHighlighted = false THEN 1 END) as normalDanmaku'
      ])
      .where('isActive = true', { isActive: true })

    if (videoId) {
      queryBuilder.andWhere('videoId = :videoId', { videoId })
    }

    return await queryBuilder.getRawOne()
  }

  // 应用查询过滤器
  private applyFilters(queryBuilder: any, filters: DanmakuFilterDto) {
    if (filters.text) {
      queryBuilder.andWhere('danmaku.text LIKE :text', { text: `%${filters.text}%` })
    }

    if (filters.videoId) {
      queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId: filters.videoId })
    }

    if (filters.mediaResourceId) {
      queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { 
        mediaResourceId: filters.mediaResourceId 
      })
    }

    if (filters.userId) {
      queryBuilder.andWhere('danmaku.userId = :userId', { userId: filters.userId })
    }

    if (filters.color) {
      queryBuilder.andWhere('danmaku.color = :color', { color: filters.color })
    }

    if (filters.type) {
      queryBuilder.andWhere('danmaku.type = :type', { type: filters.type })
    }

    if (filters.priority !== undefined) {
      queryBuilder.andWhere('danmaku.priority = :priority', { priority: filters.priority })
    }

    if (filters.isHighlighted !== undefined) {
      queryBuilder.andWhere('danmaku.isHighlighted = :isHighlighted', { 
        isHighlighted: filters.isHighlighted 
      })
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive: filters.isActive })
    }

    // 日期范围过滤
    if (filters.dateRange?.start && filters.dateRange?.end) {
      queryBuilder.andWhere('danmaku.createdAt BETWEEN :start AND :end', {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      })
    } else if (filters.dateRange?.start) {
      queryBuilder.andWhere('danmaku.createdAt >= :start', { 
        start: filters.dateRange.start 
      })
    } else if (filters.dateRange?.end) {
      queryBuilder.andWhere('danmaku.createdAt <= :end', { 
        end: filters.dateRange.end 
      })
    }

    // 内容过滤
    if (filters.customFilters?.containsSensitive) {
      queryBuilder.andWhere('danmaku.filters.containsSensitive = :containsSensitive', {
        containsSensitive: true
      })
    }

    if (filters.customFilters?.containsSpam) {
      queryBuilder.andWhere('danmaku.filters.containsSpam = :containsSpam', {
        containsSpam: true
      })
    }

    if (filters.customFilters?.containsEmojis) {
      queryBuilder.andWhere('danmaku.filters.containsEmojis = :containsEmojis', {
        containsEmojis: true
      })
    }
  }

  // 应用查询参数
  private applyQueryParams(queryBuilder: any, queryDto: DanmakuQueryDto) {
    const {
      limit = 50,
      offset = 0,
      sort = 'DESC',
      sortBy = 'createdAt'
    } = queryDto

    queryBuilder
      .orderBy(`danmaku.${sortBy}`, sort)
      .skip(offset)
      .take(limit)
  }

  // 文本过滤和清理
  private filterText(text: string): string {
    let filtered = text.trim()

    // 移除HTML标签
    filtered = filtered.replace(/<[^>]*>/g, '')

    // 移除脚本标签
    filtered = filtered.replace(/<script[^>]*>.*?<\/script>/gi, '')

    // 移除样式标签
    filtered = filtered.replace(/<style[^>]*>.*?<\/style>/gi, '')

    // 截断超长文本
    filtered = filtered.length > 200 ? filtered.substring(0, 200) + '...' : filtered

    // 替换行符为空格
    filtered = filtered.replace(/\s+/g, ' ')

    return filtered
  }

  // 内容分析（用于自动过滤）
  private analyzeContent(text: string) {
    const filters = {
      containsSensitive: false,
      containsSpam: false,
      containsEmojis: false,
      keywords: [] as string[]
    }

    // 敏感词检测（简单示例）
    const sensitiveWords = ['傻逼', '草泥马', '妈的', '操你', '傻叉']
    filters.containsSensitive = sensitiveWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    )

    // 垃圾信息检测
    const spamPatterns = [
      /http[s]?:\/\/|www\./gi, // 链接
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)/gi, // 电话号码
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/gi, // 邮箱
      /【.*?】.*?【.*?】/g, // 特殊格式
      /关注.*?公众号.*?/gi,
      /加.*?群.*?/gi
    ]
    filters.containsSpam = spamPatterns.some(pattern => pattern.test(text))

    // 表情符号检测
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D\uFE0F]|[\p{Emoji}\uFE0F\u200D\uFE0F]/gu
    filters.containsEmojis = emojiRegex.test(text)

    // 关键词提取
    const keywords = text.match(/[\u4e00-\u9fa5]+/g) || []
    filters.keywords = [...new Set(keywords)].slice(0, 10) // 去重并限制数量

    return filters
  }

  // 导入弹幕数据
  async importData(data: any[]): Promise<number> {
    let importedCount = 0
    const batchSize = 100

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const processedBatch = batch.map(item => ({
        danmakuId: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: this.filterText(item.text || ''),
        color: item.color || '#FFFFFF',
        type: item.type || 'scroll',
        priority: item.priority || 1,
        isHighlighted: item.isHighlighted || false,
        isActive: true,
        filters: this.analyzeContent(item.text || ''),
        metadata: {
          timestamp: item.timestamp || Date.now(),
          userAgent: item.userAgent || 'imported'
        },
        userId: item.userId || 1, // 默认用户
        mediaResourceId: item.mediaResourceId || 0,
        videoId: item.videoId || '',
      }))

      const savedBatch = await this.danmakuRepository.save(processedBatch)
      importedCount += savedBatch.length
    }

    this.logger.log(`导入完成，共导入 ${importedCount} 条弹幕`)
    return importedCount
  }
}