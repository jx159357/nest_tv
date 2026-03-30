import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { ParseProvider } from '../entities/parse-provider.entity';
import { CreateParseProviderDto } from './dto/create-parse-provider.dto';
import { UpdateParseProviderDto } from './dto/update-parse-provider.dto';
import { ParseProviderQueryDto } from './dto/parse-provider-query.dto';
import axios from 'axios';

interface CategoryRow {
  category?: string | null;
}

interface AverageSuccessRateRow {
  avgSuccessRate?: number | string | null;
}

interface ParseProviderConfig extends Record<string, unknown> {
  playUrlsPath?: string;
  downloadUrlsPath?: string;
  subtitleUrlsPath?: string;
  metadataPath?: string;
}

interface TestProviderResult {
  success: boolean;
  message: string;
  responseTime: number;
  data?: unknown;
}

interface ParseVideoUrlResult {
  success: boolean;
  message: string;
  playUrls?: string[];
  downloadUrls?: string[];
  subtitleUrls?: string[];
  metadata?: unknown;
}

@Injectable()
export class ParseProvidersService {
  private readonly logger = new Logger(ParseProvidersService.name);

  constructor(
    @InjectRepository(ParseProvider)
    private parseProviderRepository: Repository<ParseProvider>,
  ) {}

  /**
   * 创建解析提供商
   */
  async create(createParseProviderDto: CreateParseProviderDto): Promise<ParseProvider> {
    const parseProvider = this.parseProviderRepository.create(createParseProviderDto);
    return await this.parseProviderRepository.save(parseProvider);
  }

  /**
   * 分页查询解析提供商
   */
  async findAll(queryDto: ParseProviderQueryDto): Promise<{
    data: ParseProvider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      activeOnly = true,
      supportOnlinePlay,
      supportDownload,
      minSuccessRate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
    } = queryDto;

    const queryBuilder = this.parseProviderRepository.createQueryBuilder('provider');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(provider.name LIKE :search OR provider.description LIKE :search OR provider.baseUrl LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 分类过滤
    if (category) {
      queryBuilder.andWhere('provider.category = :category', { category });
    }

    // 优先级过滤
    if (priority) {
      queryBuilder.andWhere('provider.priority = :priority', { priority });
    }

    // 在线播放支持过滤
    if (supportOnlinePlay !== undefined) {
      queryBuilder.andWhere('provider.supportOnlinePlay = :supportOnlinePlay', {
        supportOnlinePlay,
      });
    }

    // 下载链接支持过滤
    if (supportDownload !== undefined) {
      queryBuilder.andWhere('provider.supportDownload = :supportDownload', { supportDownload });
    }

    // 成功率过滤
    if (minSuccessRate !== undefined) {
      queryBuilder.andWhere('provider.successRate >= :minSuccessRate', { minSuccessRate });
    }

    // 只查询可用的提供商
    if (activeOnly) {
      queryBuilder.andWhere('provider.isActive = :isActive', { isActive: true });
    }

    // 排除过期的提供商
    queryBuilder.andWhere('(provider.expireDate IS NULL OR provider.expireDate > :now)', {
      now: new Date(),
    });

    // 排序
    const validSortFields = [
      'id',
      'name',
      'successRate',
      'requestCount',
      'createdAt',
      'updatedAt',
      'priority',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`provider.${sortField}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查找解析提供商
   */
  async findById(id: number): Promise<ParseProvider> {
    const parseProvider = await this.parseProviderRepository.findOne({
      where: { id },
    });

    if (!parseProvider) {
      throw new NotFoundException('解析提供商不存在');
    }

    return parseProvider;
  }

  async findByName(name: string, activeOnly: boolean = true): Promise<ParseProvider | null> {
    const queryBuilder = this.parseProviderRepository
      .createQueryBuilder('provider')
      .where('provider.name = :name', { name });

    if (activeOnly) {
      queryBuilder.andWhere('provider.isActive = :isActive', { isActive: true });
    }

    return queryBuilder.getOne();
  }

  /**
   * 更新解析提供商
   */
  async update(id: number, updateParseProviderDto: UpdateParseProviderDto): Promise<ParseProvider> {
    const parseProvider = await this.findById(id);
    Object.assign(parseProvider, updateParseProviderDto);
    return await this.parseProviderRepository.save(parseProvider);
  }

  /**
   * 删除解析提供商
   */
  async remove(id: number): Promise<void> {
    const parseProvider = await this.findById(id);
    await this.parseProviderRepository.remove(parseProvider);
  }

  /**
   * 软删除（标记为不活跃）
   */
  async softDelete(id: number): Promise<ParseProvider> {
    const parseProvider = await this.findById(id);
    parseProvider.isActive = false;
    return await this.parseProviderRepository.save(parseProvider);
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<string[]> {
    const categories = await this.parseProviderRepository
      .createQueryBuilder('provider')
      .select('DISTINCT provider.category', 'category')
      .where('provider.isActive = :isActive', { isActive: true })
      .orderBy('provider.category', 'ASC')
      .getRawMany<CategoryRow>();

    return categories
      .map(item => item.category)
      .filter(
        (category): category is string => typeof category === 'string' && category.length > 0,
      );
  }

  /**
   * 根据分类获取提供商
   */
  async getByCategory(category: string, activeOnly: boolean = true): Promise<ParseProvider[]> {
    const where: FindOptionsWhere<ParseProvider> = { category };
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.parseProviderRepository.find({
      where,
      order: { priority: 'DESC', successRate: 'DESC' },
    });
  }

  /**
   * 批量创建提供商
   */
  async createBulk(createParseProviderDtos: CreateParseProviderDto[]): Promise<ParseProvider[]> {
    const parseProviders = this.parseProviderRepository.create(createParseProviderDtos);
    return await this.parseProviderRepository.save(parseProviders);
  }

  /**
   * 批量更新提供商状态
   */
  async updateBulkStatus(ids: number[], isActive: boolean): Promise<void> {
    await this.parseProviderRepository.update(ids, {
      isActive,
      lastCheckedAt: new Date(),
    });
  }

  /**
   * 测试解析提供商
   */
  async testProvider(id: number, testUrl?: string): Promise<TestProviderResult> {
    const provider = await this.findById(id);

    if (!provider.canMakeRequest()) {
      return {
        success: false,
        message: '解析提供商不可用或已达到请求限制',
        responseTime: 0,
      };
    }

    const startTime = Date.now();

    try {
      const testUrlToUse = testUrl || provider.baseUrl;
      const headers = this.parseApiHeaders(provider);

      const response = await axios<unknown>({
        method: provider.apiMethod || 'GET',
        url: provider.apiUrl || testUrlToUse,
        headers,
        timeout: 30000, // 30秒超时
      });

      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      // 更新统计信息
      provider.updateRequestStats(success);
      await this.parseProviderRepository.save(provider);

      return {
        success,
        message: success ? '测试成功' : `测试失败，状态码: ${response.status}`,
        responseTime,
        data: response.data,
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;

      // 更新统计信息
      provider.updateRequestStats(false);
      await this.parseProviderRepository.save(provider);

      return {
        success: false,
        message: `测试失败: ${this.toError(error).message}`,
        responseTime,
      };
    }
  }

  /**
   * 解析视频链接
   */
  async parseVideoUrl(id: number, videoUrl: string): Promise<ParseVideoUrlResult> {
    const provider = await this.findById(id);

    if (!provider.canMakeRequest()) {
      return {
        success: false,
        message: '解析提供商不可用或已达到请求限制',
      };
    }

    try {
      const config = this.parseProviderConfig(provider);
      const headers = this.parseApiHeaders(provider);

      // 构建解析请求
      const requestData = {
        url: videoUrl,
        ...config,
      };

      const response = await axios<unknown>({
        method: provider.apiMethod || 'GET',
        url: provider.apiUrl || provider.baseUrl,
        headers,
        [provider.apiMethod === 'POST' ? 'data' : 'params']: requestData,
        timeout: 60000, // 60秒超时
      });

      // 更新统计信息
      provider.updateRequestStats(true);
      await this.parseProviderRepository.save(provider);

      // 解析返回数据
      const result = this.parseProviderResponse(response.data, config);

      return {
        success: true,
        message: '解析成功',
        ...result,
      };
    } catch (error: unknown) {
      // 更新统计信息
      provider.updateRequestStats(false);
      await this.parseProviderRepository.save(provider);

      const normalizedError = this.toError(error);
      this.logger.error(`解析视频URL失败: ${videoUrl}`, normalizedError.stack);
      return {
        success: false,
        message: `解析失败: ${normalizedError.message}`,
      };
    }
  }

  /**
   * 解析提供商响应数据
   */
  private parseProviderResponse(
    responseData: unknown,
    config: ParseProviderConfig,
  ): Omit<ParseVideoUrlResult, 'success' | 'message'> {
    const playUrls = config.playUrlsPath
      ? this.normalizeStringArray(this.extractDataByPath(responseData, config.playUrlsPath))
      : undefined;
    const downloadUrls = config.downloadUrlsPath
      ? this.normalizeStringArray(this.extractDataByPath(responseData, config.downloadUrlsPath))
      : undefined;
    const subtitleUrls = config.subtitleUrlsPath
      ? this.normalizeStringArray(this.extractDataByPath(responseData, config.subtitleUrlsPath))
      : undefined;
    const metadata = config.metadataPath
      ? this.extractDataByPath(responseData, config.metadataPath)
      : undefined;

    return {
      playUrls,
      downloadUrls,
      subtitleUrls,
      metadata,
    };
  }

  /**
   * 根据路径提取数据
   */
  private extractDataByPath(data: unknown, path: string): unknown {
    try {
      const pathParts = path.split('.');
      let current: unknown = data;

      for (const part of pathParts) {
        if (this.isRecord(current) && part in current) {
          current = current[part];
        } else {
          return null;
        }
      }

      return current;
    } catch (error: unknown) {
      this.logger.warn(`提取数据失败，路径: ${path}`, this.toError(error).stack);
      return null;
    }
  }

  /**
   * 获取最佳解析提供商
   */
  async getBestProvider(
    category?: string,
    supportOnlinePlay: boolean = true,
  ): Promise<ParseProvider | null> {
    const where: FindOptionsWhere<ParseProvider> = { isActive: true, supportOnlinePlay };
    if (category) {
      where.category = category;
    }

    return await this.parseProviderRepository.findOne({
      where,
      order: {
        priority: 'DESC',
        successRate: 'DESC',
        requestCount: 'ASC',
      },
    });
  }

  /**
   * 重置每日请求计数
   */
  async resetDailyCounts(): Promise<void> {
    await this.parseProviderRepository
      .createQueryBuilder()
      .update(ParseProvider)
      .set({
        dailyRequestCount: 0,
        dailyResetDate: new Date(),
      })
      .where('dailyRequestLimit > 0')
      .execute();
  }

  /**
   * 获取提供商统计信息
   */
  async getStats(): Promise<{
    totalProviders: number;
    activeProviders: number;
    totalCategories: number;
    averageSuccessRate: number;
    topProviders: ParseProvider[];
  }> {
    const totalProviders = await this.parseProviderRepository.count();
    const activeProviders = await this.parseProviderRepository.count({
      where: { isActive: true },
    });

    const categories = await this.getAllCategories();
    const totalCategories = categories.length;

    const averageSuccessRateResult = await this.parseProviderRepository
      .createQueryBuilder('provider')
      .select('AVG(provider.successRate)', 'avgSuccessRate')
      .where('provider.isActive = :isActive', { isActive: true })
      .getRawOne<AverageSuccessRateRow>();

    const averageSuccessRate = this.parseNumericValue(averageSuccessRateResult?.avgSuccessRate);

    const topProviders = await this.parseProviderRepository.find({
      where: { isActive: true },
      order: {
        successRate: 'DESC',
        requestCount: 'DESC',
        priority: 'DESC',
      },
      take: 10,
    });

    return {
      totalProviders,
      activeProviders,
      totalCategories,
      averageSuccessRate: Math.round(averageSuccessRate),
      topProviders,
    };
  }

  private parseProviderConfig(provider: ParseProvider): ParseProviderConfig {
    if (!provider.parseRule) {
      return {};
    }

    try {
      const parsedConfig: unknown = JSON.parse(provider.parseRule);
      return this.isRecord(parsedConfig) ? (parsedConfig as ParseProviderConfig) : {};
    } catch {
      return {};
    }
  }

  private parseApiHeaders(provider: ParseProvider): Record<string, string> {
    if (!provider.apiHeaders) {
      return {};
    }

    try {
      const parsedHeaders: unknown = JSON.parse(provider.apiHeaders);
      if (!this.isRecord(parsedHeaders)) {
        return {};
      }

      return Object.entries(parsedHeaders).reduce<Record<string, string>>(
        (headers, [key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          }
          return headers;
        },
        {},
      );
    } catch {
      return {};
    }
  }

  private normalizeStringArray(value: unknown): string[] | undefined {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
      return [value];
    }

    return undefined;
  }

  private parseNumericValue(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    return 0;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * 搜索解析提供商
   */
  async searchProviders(keyword: string, limit: number = 20): Promise<ParseProvider[]> {
    return await this.parseProviderRepository.find({
      where: [
        { name: Like(`%${keyword}%`), isActive: true },
        { description: Like(`%${keyword}%`), isActive: true },
        { category: Like(`%${keyword}%`), isActive: true },
      ],
      order: {
        successRate: 'DESC',
        priority: 'DESC',
        name: 'ASC',
      },
      take: limit,
    });
  }
}
