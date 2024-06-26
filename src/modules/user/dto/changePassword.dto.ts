import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsString()
  repeatNewPassword: string;
}

export class ForgotChangePasswordDto {
  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsString()
  repeatNewPassword: string;

  @ApiProperty()
  @IsString()
  key: number;
}
