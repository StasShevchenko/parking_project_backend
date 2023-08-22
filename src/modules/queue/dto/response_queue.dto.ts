import { ApiProperty } from '@nestjs/swagger';

export class ResponseQueueDto {
  @ApiProperty()
  userID: number;

  @ApiProperty()
  number: number;
}
