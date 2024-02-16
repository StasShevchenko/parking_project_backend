import { ApiProperty } from '@nestjs/swagger';

export class ReviewMailKeyDto {
  @ApiProperty()
  key: number;
}
