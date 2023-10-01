import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  refresh: string;
}

export class CompleteRefreshTokenDto {
  @ApiProperty()
  access: string;

  @ApiProperty()
  refresh: string;
}

export class TokenDataDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  is_staff: boolean;
}
