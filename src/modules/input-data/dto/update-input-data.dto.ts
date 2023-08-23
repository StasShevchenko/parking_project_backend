import { ApiProperty } from '@nestjs/swagger';

export class UpdateInputDataDto {
  @ApiProperty()
  seats?: number;

  @ApiProperty()
  period?: number;

  @ApiProperty()
  numberOfOutputPeriods?: number;
}
