import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';

import { ResourceType } from '../schemas/resource.schema.js';

export class ResourceQueryDto {
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}