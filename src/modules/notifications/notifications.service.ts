import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateNotificationDto } from './dto/create_notification.dto';
import { Notification } from './model/notifications.model';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationRepository: typeof Notification,
  ) {}

  async getById(userId: number) {
    return await this.notificationRepository.findAll({
      where: { userId: userId },
      attributes: { exclude: ['updatedAt'] },
    });
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<CreateNotificationDto> {
    const notification = await this.notificationRepository.create({
      userId: dto.userId,
      text: dto.text,
    });
    await notification.save();
    return notification;
  }

  async deteleById(id: number): Promise<number> {
    return await this.notificationRepository.destroy({ where: { id } });
  }

  async readNotification(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findByPk(id);
    notification.read = true;
    await notification.save();
    return notification;
  }
}
