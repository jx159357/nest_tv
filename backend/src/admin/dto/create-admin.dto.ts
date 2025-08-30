import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

/**
 * 创建角色DTO
 */
export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

/**
 * 创建权限DTO
 */
export class CreatePermissionDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;
}