import { PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * 创建角色 DTO
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

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 创建权限 DTO
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

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
