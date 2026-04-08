import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DownloadTask, DownloadTaskStatus, DownloadTaskType } from '../entities/download-task.entity';
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

    const dedupedTasks = this.dedupeTasks(await queryBuilder.getMany());
    const total = dedupedTasks.length;
    const pagination = {
      page: total > 0 ? Math.min(Number(page), Math.ceil(total / limit)) : 1,
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
    const offset = (pagination.page - 1) * pagination.limit;
    const data = dedupedTasks.slice(offset, offset + pagination.limit);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async getMineStats(userId: number) {
    const tasks = this.dedupeTasks(await this.downloadTaskRepository.find({ where: { userId } }));

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
    const existingTaskByClientId = await this.downloadTaskRepository.findOne({
      where: { userId, clientId: dto.clientId },
    });
    const existingMagnetTasks = await this.findExistingMagnetTasksByHash(userId, dto);

    const existingTask =
      existingTaskByClientId ?? existingMagnetTasks[0] ?? null;

    if (existingTask) {
      Object.assign(existingTask, this.normalizePayload(dto));
      existingTask.userId = userId;
      const savedTask = await this.downloadTaskRepository.save(existingTask);
      await this.cleanupDuplicateMagnetTasks(savedTask, existingMagnetTasks);
      return savedTask;
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
    const duplicateMagnetTasks = await this.findExistingMagnetTasksByHash(userId, {
      url: task.url,
      type: task.type,
    });

    const duplicateIds = duplicateMagnetTasks
      .filter(item => item.id)
      .map(item => item.id);

    if (duplicateIds.length > 0) {
      await this.downloadTaskRepository.delete(duplicateIds);
      return;
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

  private async findExistingMagnetTasksByHash(
    userId: number,
    dto: Pick<CreateDownloadTaskDto, 'url' | 'type'>,
  ): Promise<DownloadTask[]> {
    const taskType = this.inferTaskType(dto);
    const infoHash = this.extractMagnetInfoHash(dto.url);

    if (taskType !== DownloadTaskType.MAGNET || !infoHash) {
      return [];
    }

    const tasks = await this.downloadTaskRepository.find({
      where: { userId, type: DownloadTaskType.MAGNET },
    });

    return tasks
      .filter(task => this.extractMagnetInfoHash(task.url) === infoHash)
      .sort((left, right) => this.getTaskTimestamp(right) - this.getTaskTimestamp(left));
  }

  private async cleanupDuplicateMagnetTasks(
    keeperTask: DownloadTask,
    matchingTasks: DownloadTask[],
  ): Promise<void> {
    const duplicateIds = matchingTasks
      .filter(task => task.id && task.id !== keeperTask.id)
      .map(task => task.id);

    if (duplicateIds.length === 0) {
      return;
    }

    await this.downloadTaskRepository.delete(duplicateIds);
  }

  private inferTaskType(dto: Pick<CreateDownloadTaskDto, 'url' | 'type'>): DownloadTaskType {
    if (dto.type) {
      return dto.type;
    }

    const normalizedUrl = dto.url.trim().toLowerCase();
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

  private buildTaskDedupKey(task: Pick<DownloadTask, 'id' | 'type' | 'url'>): string {
    if (task.type === DownloadTaskType.MAGNET) {
      const infoHash = this.extractMagnetInfoHash(task.url);
      if (infoHash) {
        return `magnet:${infoHash}`;
      }
    }

    return `task:${task.id}`;
  }

  private getTaskTimestamp(task: Partial<DownloadTask>): number {
    if (!task.updatedAt) {
      return 0;
    }

    const value = task.updatedAt instanceof Date ? task.updatedAt.getTime() : new Date(task.updatedAt).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  private dedupeTasks(tasks: DownloadTask[]): DownloadTask[] {
    const taskMap = new Map<string, DownloadTask>();

    tasks.forEach(task => {
      const dedupKey = this.buildTaskDedupKey(task);
      const existingTask = taskMap.get(dedupKey);
      if (!existingTask || this.getTaskTimestamp(existingTask) <= this.getTaskTimestamp(task)) {
        taskMap.set(dedupKey, task);
      }
    });

    return [...taskMap.values()].sort(
      (left, right) => this.getTaskTimestamp(right) - this.getTaskTimestamp(left),
    );
  }

  private async clearMineByVisibleStatuses(
    userId: number,
    statuses: DownloadTaskStatus[],
  ): Promise<{ deleted: number }> {
    const tasks = await this.downloadTaskRepository.find({ where: { userId } });
    const taskGroups = new Map<string, DownloadTask[]>();

    tasks.forEach(task => {
      const dedupKey = this.buildTaskDedupKey(task);
      const group = taskGroups.get(dedupKey) ?? [];
      group.push(task);
      taskGroups.set(dedupKey, group);
    });

    const idsToDelete = [...taskGroups.values()].flatMap(group => {
      const latestTask = group.reduce((currentLatest, nextTask) =>
        this.getTaskTimestamp(currentLatest) >= this.getTaskTimestamp(nextTask)
          ? currentLatest
          : nextTask,
      );

      if (!statuses.includes(latestTask.status)) {
        return [];
      }

      return group.map(task => task.id).filter((id): id is number => typeof id === 'number');
    });

    if (idsToDelete.length === 0) {
      return { deleted: 0 };
    }

    const result = await this.downloadTaskRepository.delete(idsToDelete);
    return { deleted: result.affected || 0 };
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
