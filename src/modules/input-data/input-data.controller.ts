import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CreateInputDataDto } from './dto/create-input-data.dto';
import { UpdateInputDataDto } from './dto/update-input-data.dto';
import { InputDataService } from './input-data.service';
import { InputData } from './model/input-data.model';

@Controller('inputData')
export class InputDataController {
  constructor(private readonly inputDataService: InputDataService) {}

  @Post('')
  inputSeatsAndPeriod(
    @Body() dto: CreateInputDataDto,
  ): Promise<CreateInputDataDto> {
    return this.inputDataService.create(dto);
  }

  @Get('')
  getSeatsAndPeriod(): Promise<InputData> {
    return this.inputDataService.get();
  }

  @Patch('')
  updateSeatsAndPeriod(@Body() dto: UpdateInputDataDto): Promise<InputData> {
    return this.inputDataService.update(dto);
  }
}
