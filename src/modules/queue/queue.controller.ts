import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { allNextActivePeriod } from './dto/next_active_period.dto';
import { Queue } from './model/queue.model';
import { QueueService } from './queue.service';
import { Period } from '../../interfaces/period.interface';
import {JwtAuthGuard} from "../auth/guards/jwtAuth.guard";
import {RolesGuard} from "../auth/guards/roles.guard";
import {Roles} from "../auth/decorators/hasRoles.decorator";

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
  @UseGuards(JwtAuthGuard)
  @Post('')
  create(@Body() dto: CreateQueueDTO): Promise<Queue> {
    return this.queueService.addUserToQueue(dto);
  }

  @ApiOperation({ summary: 'Двигаем очередь вперед - только админам' })
  @ApiResponse({
    status: 200,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Get('check')
  @UseGuards(RolesGuard)
  @Roles('isAdmin')
  CheckUserActivation() {
    return this.queueService.changeActiveUsers();
  }

  @ApiOperation({
    summary: 'Получение текущего периода пользователей - только авторизованным',
  })
  @ApiParam({ name: 'fullName', type: String })
  @ApiResponse({
    status: 200,
    type: allNextActivePeriod,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Get('getThisPeriod')
  getCurrentPeriod(@Query() query: { fullName: string }) {
    return this.queueService.getCurrentQueuePeriod(query.fullName);
  }

  @ApiOperation({
    summary: 'Получение текущего периода пользователей - только авторизованным',
  })
  @ApiParam({ name: 'fullName', type: String })
  @ApiResponse({
    status: 200,
    type: allNextActivePeriod,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('isAdmin')
  @Get('getOneNextPeriod')
  getNextPeriod(@Query() query: { fullName: string }): Promise<Period[][]> {
    return this.queueService.getOneNextPeriod(query.fullName);
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
  @UseGuards(JwtAuthGuard)
  @Delete('')
  deleteFromQueue(@Param('id') id: number) {
    return this.queueService.deleteFromQueue(id);
  }

  @ApiOperation({
    summary: 'Следующие периоды пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 200,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Post('NextPeriodsById')
  getUserNextPeriods(@Body() dto: CreateQueueDTO) {
    return this.queueService.getUserNextPeriods(dto);
  }
}
