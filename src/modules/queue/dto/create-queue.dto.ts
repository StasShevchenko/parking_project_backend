import { ApiProperty } from '@nestjs/swagger';

export class CreateQueueDTO {
  @ApiProperty()
  userId: number;
}
