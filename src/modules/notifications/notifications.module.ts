import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './model/notifications.model';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [SequelizeModule.forFeature([Notification]),   TokenModule,],
  providers: [NotificationsService, JwtService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
