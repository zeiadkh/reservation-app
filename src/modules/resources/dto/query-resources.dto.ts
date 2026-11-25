import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { ResourceType } from '../schemas/resource.schema.js';

export class ResourceQueryDto {
  @ApiPropertyOptional({
    enum: ResourceType,
    example: Object.values(ResourceType)[0],
    description: 'Filter resources by type.',
  })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({
    example: 'conference',
    description: 'Search resources by name.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'Location A',
    description: 'Filter resources by location.',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'true',
    enum: ['true', 'false'],
    description: 'Filter resources by active status (Admin only).',
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}