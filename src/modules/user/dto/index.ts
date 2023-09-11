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
  is_staff?: boolean;

  @ApiProperty()
  @IsBoolean()
  is_queue_user?: boolean | null;
}

export class CreateAdminDto {
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
}
