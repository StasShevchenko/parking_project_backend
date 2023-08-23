import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModule } from 'src/modules/token/token.module';
import { User } from 'src/modules/user/model/user.model';
import { InputData } from '../input-data/model/input-data.model';
import { Queue } from './model/queue.model';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Queue]),
    SequelizeModule.forFeature([User]),
    SequelizeModule.forFeature([InputData]),
    TokenModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, JwtService],
})
export class QueueModule {}
