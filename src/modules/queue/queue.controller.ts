import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/modules/auth/has-roles.decorator';
import { RolesGuard } from 'src/modules/auth/roles.guard';
import { JWTAuthGuard } from '../auth/jwt-guard';
import { CreateQueueDTO } from './dto/create-queue.dto';
import {
  NextActivePeriodDto,
  allNextActivePeriod,
} from './dto/next_active_period.dto';
import { ResponseQueueDto } from './dto/response_queue.dto';
import { Queue } from './model/queue.model';
import { QueueService } from './queue.service';

@ApiBearerAuth()
@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @ApiOperation({
    summary: 'Добавление пользователя в очередь - только авторизованным',
  })
  @ApiResponse({
    status: 201,
    type: CreateQueueDTO,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Post('')
  create(@Body() dto: CreateQueueDTO): Promise<Queue> {
    return this.queueService.create(dto);
  }

  @ApiOperation({ summary: 'Get queue - только авторизованным' })
  @ApiResponse({
    status: 200,
    type: ResponseQueueDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Get('')
  get(): Promise<Queue[]> {
    return this.queueService.get();
  }

  @ApiOperation({ summary: 'Двигаем очередь вперед - только админам' })
  @ApiResponse({
    status: 200,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Get('check')
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  CheckUserActivation() {
    return this.queueService.CheckUserActivation();
  }

  @ApiOperation({
    summary:
      'Получение следующего периода активности пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    type: NextActivePeriodDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Get('nextPeriodActive/:id')
  getNextPeriodActive(@Param('id') id: number) {
    return this.queueService.calculationNextPeriodOneUser(id);
  }

  @ApiOperation({
    summary:
      'Получение всех следующих периодов пользователей - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    type: allNextActivePeriod,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Get('allNextPeriod')
  getAllNextPeriod() {
    return this.queueService.CalculationNextAllUsersPeriods();
  }

  @ApiOperation({
    summary: 'Удаление пользователя из очереди - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    description: 'Response: 1',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Delete('')
  deleteFromQueue(@Param('id') id: number) {
    return this.queueService.deleteFromQueue(id);
  }
}
