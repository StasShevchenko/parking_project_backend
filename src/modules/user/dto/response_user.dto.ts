import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ResponseUserDto {
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

  @ApiProperty()
  start_active_time: Date;

  @ApiProperty()
  end_active_time: Date;

  @ApiProperty()
  last_active_period: Date;
}
