import {
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiPropertyOptional({
  example: 'Ziad Khaled',
  description: 'Updated user name',
})
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
  example: 'Ziad Khaled',
  description: 'Updated user name',
})
  email?: string;
}