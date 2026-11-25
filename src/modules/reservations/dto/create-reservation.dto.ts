
import {
  IsDateString,
  IsInt,
  IsMongoId,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsMongoId()
  resourceId: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(1)
  guestCount: number;
}
