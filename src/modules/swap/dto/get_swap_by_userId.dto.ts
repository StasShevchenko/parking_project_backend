import { ApiProperty } from '@nestjs/swagger';

export class GetAllSwapByUserId {
  @ApiProperty()
  userId: number;
}
