import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { ReservationStatus } from '../schemas/reservation.schema.js';

export class ReservationQueryDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}