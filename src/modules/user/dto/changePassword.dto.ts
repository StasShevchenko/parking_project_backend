import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class changePasswordDto {
  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsString()
  repeat_newPassword: string;

  @ApiProperty()
  @IsString()
  email: string;
}
