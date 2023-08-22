import { ApiProperty } from '@nestjs/swagger';

export class NextActivePeriodDto {
  @ApiProperty()
  nextPeriod: Date;
}

export class allNextActivePeriod {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  secondName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  is_staff: boolean;

  @ApiProperty()
  is_superuser: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  nextPeriod: Date;
}
