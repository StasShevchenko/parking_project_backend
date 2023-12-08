import { ApiProperty } from '@nestjs/swagger';

export class AcceptDeclineSwap {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  accept: boolean;
}
