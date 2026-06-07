import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DownloadTask,
  DownloadTaskStatus,
  DownloadTaskType,
} from '../entities/download-task.entity';
import { CreateDownloadTaskDto } from './dtos/create-download-task.dto';
import { UpdateDownloadTaskDto } from './dtos/update-download-task.dto';
import { DownloadTaskQueryDto } from './dtos/download-task-query.dto';

@Injectable()
export class DownloadTasksService {
  constructor(
    @InjectRepository(DownloadTask)
    private readonly downloadTaskRepository: Repository<DownloadTask>,
  ) {}

  async findMine(userId: number, queryDto: DownloadTaskQueryDto) {
    const { page = 1, limit = 100, status, type, mediaResourceId, search } = queryDto;

    const subQuery = this.downloadTaskRepository
      .createQueryBuilder('dt')
      .select('MAX(dt.id)', 'maxId')
      .where('dt.userId = :userId', { userId })
      .groupBy('dt.dedupKey');

    const mainQb = this.downloadTaskRepository
      .createQueryBuilder('downloadTask')
      .innerJoin(`(${subQuery.getQuery()})`, 'latest', 'downloadTask.id = latest.maxId')
      .leftJoinAndSelect('downloadTask.mediaResource', 'mediaResource')
      .setParameters(subQuery.getParameters());

    if (status) {
      mainQb.andWhere('downloadTask.status = :status', { status });
    }
    if (type) {
      mainQb.andWhere('downloadTask.type = :type', { type });
    }
    if (mediaResourceId) {
      mainQb.andWhere('downloadTask.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }
    if (search?.trim()) {
      mainQb.andWhere(
        `(downloadTask.fileName LIKE :search OR downloadTask.sourceLabel LIKE :search OR downloadTask.url LIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    const countQb = this.downloadTaskRepository
      .createQueryBuilder('downloadTask')
      .innerJoin(`(${subQuery.getQuery()})`, 'latest', 'downloadTask.id = latest.maxId')
      .setParameters(subQuery.getParameters());

    if (status) countQb.andWhere('downloadTask.status = :status', { status });
    if (type) countQb.andWhere('downloadTask.type = :type', { type });
    if (mediaResourceId) countQb.andWhere('downloadTask.mediaResourceId = :mediaResourceId', { mediaResourceId });
    if (search?.trim()) {
      countQb.andWhere(
        `(downloadTask.fileName LIKE :search OR downloadTask.sourceLabel LIKE :search OR downloadTask.url LIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    const total = await countQb.getCount();
    const safePage = total > 0 ? Math.min(Number(page), Math.ceil(total / limit)) : 1;
    const offset = (safePage - 1) * limit;

    const dataQb = this.downloadTaskRepository
      .createQueryBuilder('downloadTask')
      .innerJoin(`(${subQuery.getQuery()})`, 'latest', 'downloadTask.id = latest.maxId')
      .leftJoinAndSelect('downloadTask.mediaResource', 'mediaResource')
      .setParameters(subQuery.getParameters());

    if (status) dataQb.andWhere('downloadTask.status = :status', { status });
    if (type) dataQb.andWhere('downloadTask.type = :type', { type });
    if (mediaResourceId) dataQb.andWhere('downloadTask.mediaResourceId = :mediaResourceId', { mediaResourceId });
    if (search?.trim()) {
      dataQb.andWhere(
        `(downloadTask.fileName LIKE :search OR downloadTask.sourceLabel LIKE :search OR downloadTask.url LIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    const data = await dataQb
      .orderBy('downloadTask.updatedAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page: safePage,
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMineStats(userId: number) {
    const subQb = this.downloadTaskRepository
      .createQueryBuilder('dt')
      .select('MAX(dt.id)', 'maxId')
      .where('dt.userId = :userId', { userId })
      .groupBy('dt.dedupKey');

    const row = await this.downloadTaskRepository
      .createQueryBuilder('t')
      .innerJoin(`(${subQb.getQuery()})`, 'latest', 't.id = latest.maxId')
      .setParameters(subQb.getParameters())
      .select([
        'COUNT(*) AS total',
        `SUM(CASE WHEN t.status IN ('pending','downloading') THEN 1 ELSE 0 END) AS active`,
        `SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed`,
        `SUM(CASE WHEN t.status IN ('error','cancelled') THEN 1 ELSE 0 END) AS failed`,
      ])
      .getRawOne();

    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      completed: Number(row?.completed ?? 0),
      failed: Number(row?.failed ?? 0),
    };
  }

  async upsertMine(userId: number, dto: CreateDownloadTaskDto): Promise<DownloadTask> {
    const dedupKey = DownloadTask.computeDedupKey(
      dto.type ?? this.inferTaskType(dto),
      dto.url,
    );

    let existingTask = await this.downloadTaskRepository.findOne({
      where: { userId, clientId: dto.clientId },
    });

    if (!existingTask && dedupKey) {
      existingTask = await this.downloadTaskRepository.findOne({
        where: { userId, dedupKey },
        order: { updatedAt: 'DESC' },
      });
      if (existingTask) {
        const dupes = await this.downloadTaskRepository.find({
          where: { userId, dedupKey },
          select: ['id'],
        });
        const ids = dupes.map(d => d.id).filter(id => id !== existingTask!.id);
        if (ids.length > 0) {
          await this.downloadTaskRepository.delete(ids);
        }
      }
    }

    if (existingTask) {
      Object.assign(existingTask, this.normalizePayload(dto));
      existingTask.dedupKey = dedupKey;
      existingTask.userId = userId;
      return this.downloadTaskRepository.save(existingTask);
    }

    const task = this.downloadTaskRepository.create({
      ...this.normalizePayload(dto),
      userId,
      dedupKey,
    });
    return this.downloadTaskRepository.save(task);
  }

  async updateMine(
    userId: number,
    clientId: string,
    dto: UpdateDownloadTaskDto,
  ): Promise<DownloadTask> {
    const task = await this.findOneByClientId(userId, clientId);
    Object.assign(task, this.normalizePayload(dto));
    return this.downloadTaskRepository.save(task);
  }

  async removeMine(userId: number, clientId: string): Promise<void> {
    const task = await this.findOneByClientId(userId, clientId);

    if (task.dedupKey) {
      const dupes = await this.downloadTaskRepository.find({
        where: { userId, dedupKey: task.dedupKey },
        select: ['id'],
      });
      const ids = dupes.map(d => d.id);
      if (ids.length > 0) {
        await this.downloadTaskRepository.delete(ids);
        return;
      }
    }

    await this.downloadTaskRepository.remove(task);
  }

  async clearCompletedMine(userId: number): Promise<{ deleted: number }> {
    return this.clearMineByVisibleStatuses(userId, [DownloadTaskStatus.COMPLETED]);
  }

  async clearFailedMine(userId: number): Promise<{ deleted: number }> {
    return this.clearMineByVisibleStatuses(userId, [
      DownloadTaskStatus.ERROR,
      DownloadTaskStatus.CANCELLED,
    ]);
  }

  private async findOneByClientId(userId: number, clientId: string): Promise<DownloadTask> {
    const task = await this.downloadTaskRepository.findOne({
      where: { userId, clientId },
      relations: ['mediaResource'],
    });

    if (!task) {
      throw new NotFoundException('下载任务不存在');
    }

    return task;
  }

  private inferTaskType(dto: Pick<CreateDownloadTaskDto, 'url' | 'type'>): DownloadTaskType {
    if (dto.type) {
      return dto.type;
    }

    const normalizedUrl = (dto.url ?? '').trim().toLowerCase();
    if (normalizedUrl.startsWith('magnet:')) {
      return DownloadTaskType.MAGNET;
    }

    if (normalizedUrl.endsWith('.torrent') || normalizedUrl.includes('torrent')) {
      return DownloadTaskType.TORRENT;
    }

    return DownloadTaskType.DIRECT;
  }

  private extractMagnetInfoHash(url: string): string | null {
    const magnetMatch = url.trim().match(/(?:\?|&)xt=urn:btih:([^&]+)/i);
    if (!magnetMatch?.[1]) {
      return null;
    }

    return decodeURIComponent(magnetMatch[1]).trim().toLowerCase();
  }

  private async clearMineByVisibleStatuses(
    userId: number,
    statuses: DownloadTaskStatus[],
  ): Promise<{ deleted: number }> {
    const subQb = this.downloadTaskRepository
      .createQueryBuilder('dt')
      .select('MAX(dt.id)', 'maxId')
      .where('dt.userId = :userId', { userId })
      .groupBy('dt.dedupKey');

    const latestIds = await this.downloadTaskRepository
      .createQueryBuilder('t')
      .innerJoin(`(${subQb.getQuery()})`, 'latest', 't.id = latest.maxId')
      .setParameters(subQb.getParameters())
      .select('t.id')
      .where('t.status IN (:...statuses)', { statuses })
      .getMany();

    if (latestIds.length === 0) {
      return { deleted: 0 };
    }

    const ids = latestIds.map(t => t.id);
    const result = await this.downloadTaskRepository.delete(ids);
    return { deleted: result.affected || 0 };
  }

  private normalizePayload(dto: Partial<CreateDownloadTaskDto>) {
    const nextStatus = dto.status;
    const normalizedProgress =
      typeof dto.progress === 'number'
        ? Math.max(0, Math.min(100, Math.round(dto.progress)))
        : dto.progress;

    const taskType = dto.type ?? this.inferTaskType(dto as Pick<CreateDownloadTaskDto, 'url' | 'type'>);
    const dedupKey = DownloadTask.computeDedupKey(taskType, dto.url ?? '');

    return {
      ...dto,
      progress: nextStatus === DownloadTaskStatus.COMPLETED ? 100 : normalizedProgress,
      completedAt:
        nextStatus === DownloadTaskStatus.COMPLETED
          ? dto.completedAt || new Date()
          : dto.completedAt,
      lastLaunchedAt: dto.lastLaunchedAt,
      dedupKey: dedupKey || (dto as Record<string, unknown>).dedupKey || '',
    };
  }
}
