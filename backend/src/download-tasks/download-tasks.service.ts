import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DownloadTask, DownloadTaskStatus } from '../entities/download-task.entity';
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

    const queryBuilder = this.downloadTaskRepository
      .createQueryBuilder('downloadTask')
      .leftJoinAndSelect('downloadTask.mediaResource', 'mediaResource')
      .where('downloadTask.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('downloadTask.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('downloadTask.type = :type', { type });
    }

    if (mediaResourceId) {
      queryBuilder.andWhere('downloadTask.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (search?.trim()) {
      queryBuilder.andWhere(
        `(
          downloadTask.fileName LIKE :search OR
          downloadTask.sourceLabel LIKE :search OR
          downloadTask.url LIKE :search
        )`,
        { search: `%${search.trim()}%` },
      );
    }

    queryBuilder.orderBy('downloadTask.updatedAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMineStats(userId: number) {
    const tasks = await this.downloadTaskRepository.find({ where: { userId } });

    return {
      total: tasks.length,
      active: tasks.filter(task =>
        [DownloadTaskStatus.PENDING, DownloadTaskStatus.DOWNLOADING].includes(task.status),
      ).length,
      completed: tasks.filter(task => task.status === DownloadTaskStatus.COMPLETED).length,
      failed: tasks.filter(task =>
        [DownloadTaskStatus.ERROR, DownloadTaskStatus.CANCELLED].includes(task.status),
      ).length,
    };
  }

  async upsertMine(userId: number, dto: CreateDownloadTaskDto): Promise<DownloadTask> {
    const existingTask = await this.downloadTaskRepository.findOne({
      where: { userId, clientId: dto.clientId },
    });

    if (existingTask) {
      Object.assign(existingTask, this.normalizePayload(dto));
      existingTask.userId = userId;
      return this.downloadTaskRepository.save(existingTask);
    }

    const task = this.downloadTaskRepository.create({
      ...this.normalizePayload(dto),
      userId,
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
    await this.downloadTaskRepository.remove(task);
  }

  async clearCompletedMine(userId: number): Promise<{ deleted: number }> {
    const result = await this.downloadTaskRepository.delete({
      userId,
      status: DownloadTaskStatus.COMPLETED,
    });

    return { deleted: result.affected || 0 };
  }

  async clearFailedMine(userId: number): Promise<{ deleted: number }> {
    const result = await this.downloadTaskRepository.delete({
      userId,
      status: In([DownloadTaskStatus.ERROR, DownloadTaskStatus.CANCELLED]),
    });

    return { deleted: result.affected || 0 };
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

  private normalizePayload(dto: Partial<CreateDownloadTaskDto>) {
    const nextStatus = dto.status;
    const normalizedProgress =
      typeof dto.progress === 'number'
        ? Math.max(0, Math.min(100, Math.round(dto.progress)))
        : dto.progress;

    return {
      ...dto,
      progress: nextStatus === DownloadTaskStatus.COMPLETED ? 100 : normalizedProgress,
      completedAt:
        nextStatus === DownloadTaskStatus.COMPLETED
          ? dto.completedAt || new Date()
          : dto.completedAt,
      lastLaunchedAt: dto.lastLaunchedAt,
    };
  }
}
