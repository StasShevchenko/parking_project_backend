import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  secondName: string;

  @ApiProperty()
  @IsString()
  email: string;

  @IsBoolean()
  @ApiProperty()
  isAdmin?: boolean;

  @ApiProperty()
  @IsBoolean()
  queueUser?: boolean | null;
}
