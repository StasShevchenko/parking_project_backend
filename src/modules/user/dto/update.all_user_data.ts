import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class UpdateAllUserDataDto {
  @ApiProperty()
  @IsString()
  firstName?: string;

  @ApiProperty()
  @IsString()
  secondName?: string;

  @ApiProperty()
  @IsString()
  email?: string;

  @IsBoolean()
  @ApiProperty()
  is_staff?: boolean;

  @ApiProperty()
  @IsBoolean()
  is_superuser?: boolean | null;
}
