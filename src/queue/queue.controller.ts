import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('')
  create(@Body() dto: CreateQueueDTO): Promise<Queue> {
    return this.queueService.create(dto);
  }

  @Get('')
  get(): Promise<Queue[]> {
    return this.queueService.get();
  }

  @Get('check')
  CheckUserActivation() {
    return this.queueService.CheckUserActivation();
  }

  @Get('nextPeriodActive/:id')
  getNextPeriodActive(@Param('id') id: number) {
    return this.queueService.calculationNextPeriodOneUser(id);
  }

  @Get('allNextPeriod')
  getAllNextPeriod() {
    return this.queueService.CalculationNextAllUsersPeriods();
  }
}
