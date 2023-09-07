import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  text: string;
}
