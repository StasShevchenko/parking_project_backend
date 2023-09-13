import { ApiProperty } from '@nestjs/swagger';

export class MailKeyReviewDto {
  @ApiProperty()
  key: number;
}
