import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/modules/user/model/user.model';
import { Queue } from './model/queue.model';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Queue]),
    SequelizeModule.forFeature([User]),
  ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
