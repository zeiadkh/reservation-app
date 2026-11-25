import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  Min,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiPropertyOptional({
    example: '674a1b2c3d4e5f6789012345',
    description: 'New resource ID.',
  })
  @IsOptional()
  @IsMongoId()
  resourceId?: string;

  @ApiPropertyOptional({
    example: '2026-12-01T10:00:00.000Z',
    description: 'Updated reservation start date and time in ISO 8601 format.',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({
    example: '2026-12-01T12:00:00.000Z',
    description: 'Updated reservation end date and time in ISO 8601 format.',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    description: 'Updated number of guests.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;
}