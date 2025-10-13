/**
 * 文件大小格式化工具
 */

/**
 * 格式化文件大小为可读字符串
 * @param bytes 文件大小（字节）
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 将格式化的文件大小字符串转换为字节数
 * @param formattedSize 格式化的文件大小字符串 (如: "10.5 MB")
 * @returns 文件大小（字节）
 */
export function parseFileSize(formattedSize: string): number {
  const match = formattedSize.match(/^(\d+(?:\.\d+)?)\s+([A-Za-z]+)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const units: Record<string, number> = {
    BYTES: 1,
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
    PB: 1024 * 1024 * 1024 * 1024 * 1024,
    EB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    ZB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    YB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    KIB: 1000,
    MIB: 1000 * 1000,
    GIB: 1000 * 1000 * 1000,
    TIB: 1000 * 1000 * 1000 * 1000,
    PIB: 1000 * 1000 * 1000 * 1000 * 1000,
    EIB: 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    ZIB: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
    YIB: 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
  };

  const multiplier = units[unit] || 1;
  return Math.round(value * multiplier);
}

/**
 * 检查文件大小是否超过限制
 * @param fileSize 文件大小（字节）
 * @param maxSize 最大文件大小（字节）
 * @returns 是否超过限制
 */
export function isFileSizeExceeded(fileSize: number, maxSize: number): boolean {
  return fileSize > maxSize;
}

/**
 * 获取文件大小的限制信息
 * @param maxSize 最大文件大小（字节）
 * @returns 文件大小限制的描述信息
 */
export function getFileSizeLimitInfo(maxSize: number): string {
  const formattedMaxSize = formatFileSize(maxSize);
  return `最大文件大小: ${formattedMaxSize}`;
}

/**
 * 计算文件上传进度百分比
 * @param loaded 已上传的字节数
 * @param total 总字节数
 * @returns 进度百分比（0-100）
 */
export function calculateUploadProgress(loaded: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
}

/**
 * 估算文件上传剩余时间
 * @param loaded 已上传的字节数
 * @param total 总字节数
 * @param uploadSpeed 上传速度（字节/秒）
 * @returns 估算的剩余时间（秒），如果无法估算则返回null
 */
export function estimateUploadTime(
  loaded: number,
  total: number,
  uploadSpeed: number,
): number | null {
  if (uploadSpeed <= 0) return null;

  const remainingBytes = total - loaded;
  if (remainingBytes <= 0) return 0;

  return remainingBytes / uploadSpeed;
}

/**
 * 格式化时间长度
 * @param seconds 时间长度（秒）
 * @returns 格式化的时间字符串 (HH:MM:SS 或 MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化上传时间估算
 * @param seconds 秒数
 * @returns 可读的时间估算字符串
 */
export function formatUploadTimeEstimate(seconds: number | null): string {
  if (seconds === null) return '计算中...';
  if (seconds === 0) return '已完成';
  if (seconds < 0) return '未知';

  if (seconds < 60) {
    return `${Math.ceil(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours}小时`;
  }
}
