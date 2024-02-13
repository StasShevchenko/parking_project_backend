import { ApiProperty } from '@nestjs/swagger';

export class AcceptDeclineSwapDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  accept: boolean;
}
