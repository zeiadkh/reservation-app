import {
  IsDateString,
  IsInt,
  IsMongoId,
  Min,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    example: '674a1b2c3d4e5f6789012345',
    description: 'ID of the resource to check.',
  })
  @IsMongoId()
  resourceId: string;

  @ApiProperty({
    example: '2026-12-01T10:00:00.000Z',
    description: 'Reservation start date and time in ISO 8601 format.',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    example: '2026-12-01T12:00:00.000Z',
    description: 'Reservation end date and time in ISO 8601 format.',
  })
  @IsDateString()
  endAt: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    description: 'Number of guests.',
  })
  @IsInt()
  @Min(1)
  guestCount: number;
}