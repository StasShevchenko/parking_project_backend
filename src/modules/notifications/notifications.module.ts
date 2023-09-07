import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from './model/notifications.model';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [SequelizeModule.forFeature([Notification])],
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
