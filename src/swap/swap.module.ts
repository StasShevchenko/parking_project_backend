import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QueueModule } from 'src/modules/queue/queue.module';
import { UserModule } from 'src/modules/user/user.module';
import { Swap } from './model/swap.model';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';

@Module({
  imports: [SequelizeModule.forFeature([Swap]), QueueModule, UserModule],
  controllers: [SwapController],
  providers: [SwapService],
  exports: [SwapService],
})
export class SwapModule {}
