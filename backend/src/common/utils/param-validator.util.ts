import { BadRequestException } from '@nestjs/common';

/**
 * 解析查询参数中的数字值
 * @param value 查询参数值
 * @param defaultValue 默认值
 * @param paramName 参数名称（用于错误信息）
 * @param min 最小值（可选）
 * @param max 最大值（可选）
 * @returns 解析后的数字值
 */
export function parseQueryNumber(
  value: string | undefined,
  defaultValue: number,
  paramName: string = 'parameter',
  min?: number,
  max?: number,
): number {
  if (!value) {
    return defaultValue;
  }

  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new BadRequestException(`Invalid ${paramName}: must be a valid number`);
  }

  if (min !== undefined && parsedValue < min) {
    throw new BadRequestException(`${paramName} must be at least ${min}`);
  }

  if (max !== undefined && parsedValue > max) {
    throw new BadRequestException(`${paramName} must be at most ${max}`);
  }

  return parsedValue;
}

/**
 * 解析查询参数中的布尔值
 * @param value 查询参数值
 * @param defaultValue 默认值
 * @returns 解析后的布尔值
 */
export function parseQueryBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'true' || normalizedValue === '1') {
    return true;
  }
  if (normalizedValue === 'false' || normalizedValue === '0') {
    return false;
  }

  throw new BadRequestException('Invalid boolean value: must be true, false, 1, or 0');
}

/**
 * 解析查询参数中的枚举值
 * @param value 查询参数值
 * @param enumValues 枚举值数组
 * @param defaultValue 默认值
 * @param paramName 参数名称（用于错误信息）
 * @returns 解析后的枚举值
 */
export function parseQueryEnum<T extends string>(
  value: string | undefined,
  enumValues: T[],
  defaultValue: T,
  paramName: string = 'parameter',
): T {
  if (!value) {
    return defaultValue;
  }

  const normalizedValue = value.toLowerCase() as T;
  if (enumValues.includes(normalizedValue)) {
    return normalizedValue;
  }

  throw new BadRequestException(`Invalid ${paramName}: must be one of ${enumValues.join(', ')}`);
}

/**
 * 解析查询参数中的日期值
 * @param value 查询参数值
 * @param paramName 参数名称（用于错误信息）
 * @returns 解析后的日期对象
 */
export function parseQueryDate(
  value: string | undefined,
  paramName: string = 'date',
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);
  if (isNaN(parsedDate.getTime())) {
    throw new BadRequestException(`Invalid ${paramName}: must be a valid date`);
  }

  return parsedDate;
}
