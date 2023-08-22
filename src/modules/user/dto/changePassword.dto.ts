import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class changePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;
}
