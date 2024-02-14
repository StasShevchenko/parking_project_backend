import { ApiProperty } from '@nestjs/swagger';

export class AcceptDeclineSwapDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  swapId: number;

  @ApiProperty()
  accept: boolean;
}
