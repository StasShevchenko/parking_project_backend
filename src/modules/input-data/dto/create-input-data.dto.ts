import { ApiProperty } from '@nestjs/swagger';

export class CreateInputDataDto {
  @ApiProperty()
  seats: number;

  @ApiProperty()
  period: number;

  @ApiProperty()
  numberOfOutputPeriods: number;
}
