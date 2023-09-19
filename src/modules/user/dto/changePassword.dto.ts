import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class changePasswordFromProfileDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsString()
  repeat_newPassword: string;
}

export class PasswordForgotChangeDto {
  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsString()
  repeat_newPassword: string;

  @ApiProperty()
  @IsString()
  key: number;
}
