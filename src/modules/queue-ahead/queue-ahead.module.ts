import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InputData } from '../input-data/model/input-data.model';
import { TokenModule } from '../token/token.module';
import { QueueAhead } from './model/queue_ahead.model';
import { QueueAheadController } from './queue-ahead.controller';
import { QueueAheadService } from './queue-ahead.service';

@Module({
  imports: [
    SequelizeModule.forFeature([QueueAhead]),
    SequelizeModule.forFeature([InputData]),
    TokenModule,
  ],
  providers: [QueueAheadService],
  controllers: [QueueAheadController],
  exports: [QueueAheadService],
})
export class QueueAheadModule {}
