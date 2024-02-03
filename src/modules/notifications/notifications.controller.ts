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
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create_notification.dto';
import { Notification } from './model/notifications.model';
import { NotificationsService } from './notifications.service';
import {JwtAuthGuard} from "../auth/jwtAuth.guard";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @ApiOperation({
    summary:
      'Получение всех уведомлений пользователя по id - только авторизованным',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getAllByUserId(@Param('id') id: number) {
    return this.notificationService.getById(id);
  }

  @ApiOperation({ summary: 'Создание уведомления - по идее автоматическое' })
  @ApiResponse({
    status: 201,
    type: CreateNotificationDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Post('create')
  createNotification(
    @Body('') dto: CreateNotificationDto,
  ): Promise<CreateNotificationDto> {
    return this.notificationService.createNotification(dto);
  }

  @ApiOperation({
    summary: 'Удаление уведомления по id - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    description: 'Response: 1',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteNotificationById(@Param('id') id: number): Promise<number> {
    return this.notificationService.deteleById(id);
  }

  @ApiOperation({
    summary: 'Чтение уведомлений по id - только авторизованным',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Get('read/:id')
  readNotification(@Param('id') id: number): Promise<Notification> {
    return this.notificationService.readNotification(id);
  }
}
