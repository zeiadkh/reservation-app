import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { ReservationStatus } from '../schemas/reservation.schema.js';

export class ReservationQueryDto {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
    description: 'Filter reservations by status.',
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({
    example: '2026-12-01T00:00:00.000Z',
    description: 'Filter reservations starting after this date.',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Filter reservations ending before this date.',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}