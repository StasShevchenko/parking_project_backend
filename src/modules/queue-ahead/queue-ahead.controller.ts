import { Controller } from '@nestjs/common';
import { QueueAheadService } from './queue-ahead.service';

@Controller('queue-ahead')
export class QueueAheadController {
  constructor(private readonly queueAheadService: QueueAheadService) {}

  // @Get('')
  // getQueueAhead(): Promise<QueueAhead[]> {
  //   return this.queueAheadService.getAllQueueAhead();
  // }
}
