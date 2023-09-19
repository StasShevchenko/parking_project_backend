import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/has-roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInputDataDto } from './dto/create-input-data.dto';
import { UpdateInputDataDto } from './dto/update-input-data.dto';
import { InputDataService } from './input-data.service';
import { InputData } from './model/input-data.model';

@ApiBearerAuth()
@ApiTags('Input Data')
@Controller('inputData')
export class InputDataController {
  constructor(private readonly inputDataService: InputDataService) {}

  @ApiOperation({
    summary:
      'Первый раз задаем seats, period, numberOfOutputPeriods - только админам',
  })
  @ApiResponse({
    status: 201,
    type: CreateInputDataDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  @Post('')
  inputSeatsAndPeriod(
    @Body() dto: CreateInputDataDto,
  ): Promise<CreateInputDataDto> {
    return this.inputDataService.create(dto);
  }

  @ApiOperation({
    summary: 'Получение input data - только админам',
  })
  @ApiResponse({
    status: 200,
    type: CreateInputDataDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  @Get('')
  getSeatsAndPeriod(): Promise<InputData> {
    return this.inputDataService.get();
  }

  @ApiOperation({
    summary: 'Изменяем seats, period, numberOfOutputPeriods - только админам',
  })
  @ApiResponse({
    status: 201,
    type: UpdateInputDataDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  @Patch('')
  updateSeatsAndPeriod(@Body() dto: UpdateInputDataDto): Promise<InputData> {
    return this.inputDataService.update(dto);
  }
}
