import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseHealthService } from '../services/database-health.service';
import { CacheService } from '../cache/cache.service';
import { AppLoggerService } from '../services/app-logger.service';

@ApiTags('系统管理')
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheService: CacheService,
    private readonly loggerService: AppLoggerService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '系统健康检查',
    description: '检查数据库、Redis等核心服务的健康状态，返回系统整体健康状况和各服务详细状态',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '系统健康',
    schema: {
      type: 'object',
      example: {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        responseTime: 45,
        uptime: 3600,
        environment: 'development',
        version: '1.0.0',
        services: {
          database: {
            status: 'healthy',
            details: {
              isHealthy: true,
              connectionCount: 5,
              maxConnections: 100,
              responseTime: 12,
            },
            error: null,
          },
          redis: {
            status: 'healthy',
            details: {
              status: 'healthy',
              message: 'Redis连接正常',
              responseTime: 3,
            },
            error: null,
          },
        },
        metadata: {
          nodeVersion: 'v18.0.0',
          platform: 'win32',
          arch: 'x64',
          memoryUsage: {
            rss: 52428800,
            heapTotal: 31457280,
            heapUsed: 20971520,
            external: 2097152,
          },
          cpuUsage: {
            user: 1200000,
            system: 800000,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: '服务异常',
    schema: {
      type: 'object',
      example: {
        status: 'unhealthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        responseTime: 5000,
        services: {
          database: {
            status: 'unhealthy',
            details: null,
            error: 'Connection timeout',
          },
          redis: {
            status: 'healthy',
            details: {
              status: 'healthy',
              message: 'Redis连接正常',
            },
            error: null,
          },
        },
      },
    },
  })
  async getHealth() {
    const startTime = Date.now();

    // 并行检查各个服务
    const [databaseHealth, redisHealth] = await Promise.allSettled([
      this.databaseHealthService.checkDatabaseHealth(),
      this.checkRedisHealth(),
    ]);

    const responseTime = Date.now() - startTime;

    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status:
            databaseHealth.status === 'fulfilled' && databaseHealth.value ? 'healthy' : 'unhealthy',
          details:
            databaseHealth.status === 'fulfilled' ? { isHealthy: databaseHealth.value } : null,
          error: databaseHealth.status === 'rejected' ? databaseHealth.reason?.message : null,
        },
        redis: {
          status: redisHealth.status === 'fulfilled' && redisHealth.value ? 'healthy' : 'unhealthy',
          details: redisHealth.status === 'fulfilled' ? redisHealth.value : null,
          error: redisHealth.status === 'rejected' ? redisHealth.reason?.message : null,
        },
      },
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    // 如果任何核心服务不健康，设置整体状态为 unhealthy
    const unhealthyServices = Object.values(result.services).filter(
      service => service.status !== 'healthy',
    );
    if (unhealthyServices.length > 0) {
      result.status = 'unhealthy';
    }

    this.loggerService.log(`健康检查完成 - 状态: ${result.status}, 响应时间: ${responseTime}ms`);

    return result;
  }

  @Get('database')
  @ApiOperation({ summary: '数据库健康检查', description: '专门检查数据库连接状态' })
  async getDatabaseHealth() {
    const health = await this.databaseHealthService.checkDatabaseHealth();
    const status = this.databaseHealthService.getDatabaseStatus();

    return {
      health,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis健康检查', description: '专门检查Redis连接状态' })
  async getRedisHealth() {
    return this.checkRedisHealth();
  }

  @Get('readiness')
  @ApiOperation({ summary: '就绪检查', description: '检查应用是否准备好接收请求' })
  async getReadiness() {
    try {
      // 检查数据库连接
      await this.databaseHealthService.checkDatabaseHealth();

      // 检查Redis连接（如果配置了）
      if (process.env.REDIS_HOST) {
        await this.checkRedisHealth();
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: '应用已准备好接收请求',
      };
    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: '应用未准备好',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  @Get('liveness')
  @ApiOperation({ summary: '存活检查', description: '检查应用是否正在运行' })
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: '应用正在运行',
    };
  }

  /**
   * 检查Redis健康状态
   */
  private async checkRedisHealth() {
    try {
      // 测试Redis连接
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'ok';

      await this.cacheService.set(testKey, testValue, { ttl: 10 }); // 10秒过期
      const retrievedValue = await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);

      if (retrievedValue === testValue) {
        return {
          status: 'healthy',
          message: 'Redis连接正常',
          responseTime: 0, // 这里可以计算实际响应时间
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis读写测试失败',
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis连接失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: '系统指标', description: '获取系统性能指标' })
  @ApiBearerAuth()
  async getMetrics() {
    const dbStatus = this.databaseHealthService.getDatabaseStatus();

    return {
      timestamp: new Date().toISOString(),
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      database: dbStatus,
      app: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
    };
  }
}
