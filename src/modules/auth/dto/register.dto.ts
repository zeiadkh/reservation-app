import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({
    example: 'Ahmed Mohammed',
    description: 'User full name',
  })
  name: string;

  @IsEmail()
  @ApiProperty({
    example: 'mail@example.com',
    description: 'Unique email address',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'StrongPass123',
    description: 'Password (minimum 8 characters)',
  })
  password: string;
}
