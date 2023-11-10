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
import { Roles } from '../auth/has-roles.decorator';
import { JWTAuthGuard } from '../auth/jwt-guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { allNextActivePeriod } from './dto/next_active_period.dto';
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
    return this.queueService.AddUserToQueue(dto);
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
    summary: 'Получение текущего периода пользователей - только авторизованным',
  })
  // @ApiParam({ name: 'fullName', type: String })
  @ApiResponse({
    status: 200,
    type: allNextActivePeriod,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(JWTAuthGuard)
  @Get('thisPeriod')
  GetThisPeriodQueue() {
    return this.queueService.GetThisPeriodQueue();
  }

  @ApiOperation({
    summary: 'Получение текущего периода пользователей - только авторизованным',
  })
  // @ApiParam({ name: 'fullName', type: String })
  @ApiResponse({
    status: 200,
    type: allNextActivePeriod,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(RolesGuard)
  // @Roles('is_staff')
  @Get('getOneNextPeriod')
  GetOneNextPeriod() {
    return this.queueService.GetOneNextPeriod();
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
