import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  ResourceType,
  WeekDay,
} from '../schemas/resource.schema.js';

class OperatingHoursDto {
  @ApiProperty({
    enum: WeekDay,
    example: WeekDay.MONDAY,
    description: 'Day of the week.',
  })
  @IsEnum(WeekDay)
  day: WeekDay;

  @ApiProperty({
    example: true,
    description: 'Whether the resource is available on this day.',
  })
  @IsBoolean()
  isOpen: boolean;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Opening time in 24-hour HH:mm format.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  openTime?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Closing time in 24-hour HH:mm format.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closeTime?: string;
}

export class CreateResourceDto {
  @ApiProperty({
    example: 'Conference Room A',
    description: 'Resource name.',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'A meeting room equipped with a projector.',
    description: 'Optional resource description.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    enum: ResourceType,
    example: Object.values(ResourceType)[0],
    description: 'Type of resource.',
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    example: 10,
    minimum: 1,
    description: 'Maximum number of guests the resource can accommodate.',
  })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    example: 'Building A, Floor 2',
    maxLength: 200,
    description: 'Resource location.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @ApiProperty({
    type: [OperatingHoursDto],
    description: 'Operating hours for each day of the week.',
    example: [
      {
        day: WeekDay.MONDAY,
        isOpen: true,
        openTime: '09:00',
        closeTime: '17:00',
      },
      {
        day: WeekDay.TUESDAY,
        isOpen: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  operatingHours: OperatingHoursDto[];
}