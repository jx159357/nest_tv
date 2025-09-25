import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { ParseProvider } from '../entities/parse-provider.entity';
import { CreateParseProviderDto } from './dto/create-parse-provider.dto';
import { UpdateParseProviderDto } from './dto/update-parse-provider.dto';
import { ParseProviderQueryDto } from './dto/parse-provider-query.dto';
import axios from 'axios';

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
      .getRawMany();

    return categories.map(item => item.category).filter(Boolean);
  }

  /**
   * 根据分类获取提供商
   */
  async getByCategory(category: string, activeOnly: boolean = true): Promise<ParseProvider[]> {
    const where: any = { category };
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
  async testProvider(
    id: number,
    testUrl?: string,
  ): Promise<{
    success: boolean;
    message: string;
    responseTime: number;
    data?: any;
  }> {
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
      const headers = provider.getApiHeaders();

      const response = await axios({
        method: provider.apiMethod || 'GET',
        url: provider.apiUrl || testUrlToUse,
        headers: headers,
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
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 更新统计信息
      provider.updateRequestStats(false);
      await this.parseProviderRepository.save(provider);

      return {
        success: false,
        message: `测试失败: ${error.message}`,
        responseTime,
      };
    }
  }

  /**
   * 解析视频链接
   */
  async parseVideoUrl(
    id: number,
    videoUrl: string,
  ): Promise<{
    success: boolean;
    message: string;
    playUrls?: string[];
    downloadUrls?: string[];
    subtitleUrls?: string[];
    metadata?: any;
  }> {
    const provider = await this.findById(id);

    if (!provider.canMakeRequest()) {
      return {
        success: false,
        message: '解析提供商不可用或已达到请求限制',
      };
    }

    try {
      const config = provider.getParseConfig();
      const headers = provider.getApiHeaders();

      // 构建解析请求
      const requestData = {
        url: videoUrl,
        ...config,
      };

      const response = await axios({
        method: provider.apiMethod || 'GET',
        url: provider.apiUrl || provider.baseUrl,
        headers: headers,
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
    } catch (error) {
      // 更新统计信息
      provider.updateRequestStats(false);
      await this.parseProviderRepository.save(provider);

      this.logger.error(`解析视频URL失败: ${videoUrl}`, error.stack);
      return {
        success: false,
        message: `解析失败: ${error.message}`,
      };
    }
  }

  /**
   * 解析提供商响应数据
   */
  private parseProviderResponse(
    responseData: any,
    config: any,
  ): {
    playUrls?: string[];
    downloadUrls?: string[];
    subtitleUrls?: string[];
    metadata?: any;
  } {
    const result: any = {};

    // 根据配置解析响应数据
    if (config.playUrlsPath) {
      result.playUrls = this.extractDataByPath(responseData, config.playUrlsPath);
    }

    if (config.downloadUrlsPath) {
      result.downloadUrls = this.extractDataByPath(responseData, config.downloadUrlsPath);
    }

    if (config.subtitleUrlsPath) {
      result.subtitleUrls = this.extractDataByPath(responseData, config.subtitleUrlsPath);
    }

    if (config.metadataPath) {
      result.metadata = this.extractDataByPath(responseData, config.metadataPath);
    }

    return result;
  }

  /**
   * 根据路径提取数据
   */
  private extractDataByPath(data: any, path: string): any {
    try {
      const pathParts = path.split('.');
      let current = data;

      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return null;
        }
      }

      return current;
    } catch (error) {
      this.logger.warn(`提取数据失败，路径: ${path}`, error.stack);
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
    const where: any = { isActive: true, supportOnlinePlay };
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
      .getRawOne();

    const averageSuccessRate = averageSuccessRateResult.avgSuccessRate || 0;

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
