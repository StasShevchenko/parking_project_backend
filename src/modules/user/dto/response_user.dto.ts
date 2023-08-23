import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class ResponseUserDto {
  @ApiProperty()
  @IsNumber()
  id: number;

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
  is_staff: boolean;

  @ApiProperty()
  @IsBoolean()
  is_superuser: boolean;

  @IsBoolean()
  @ApiProperty()
  active: boolean;

  @IsBoolean()
  @ApiProperty()
  in_queue: boolean;
}
