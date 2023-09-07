import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InputData } from '../input-data/model/input-data.model';
import { Queue } from '../queue/model/queue.model';
import { QueueAhead } from './model/queue_ahead.model';

@Injectable()
export class QueueAheadService {
  constructor(
    @InjectModel(QueueAhead)
    private readonly queueAheadRepository: typeof QueueAhead,
    @InjectModel(InputData)
    private readonly inputDataRepository: typeof InputData,
  ) {}

  async generateNewQueue(userId: number, queue: Queue[]) {
    await this.queueAheadRepository.destroy({ truncate: true });

    for (const item of queue) {
      await this.addUserToNewQueue(item);
    }

    for (let i = 0; i < 5; i++) {
      console.log(i);
      for (const item of queue) {
        await this.addUser(item.userId);
      }
    }
  }

  async addUserToNewQueue(queueItem: Queue) {
    const maxNumber = await this.getMaxNumber();
    const inputData = await this.inputDataRepository.findOne();
    return this.queueAheadRepository.create({
      userId: queueItem.userId,
      number: queueItem.number,
      start_period_time: queueItem.start_period_time,
      end_period_time: queueItem.end_period_time,
    });
  }

  async addUser(userId: number) {
    const maxNumber = await this.getMaxNumber();
    const inputData = await this.inputDataRepository.findOne();
    const end_time = new Date();
    end_time.setDate(maxNumber.end_period_time.getDate() + inputData.period);
    return this.queueAheadRepository.create({
      userId: userId,
      number: 1,
      start_period_time: maxNumber.end_period_time,
      end_period_time: end_time,
    });
  }

  async getMaxNumber(): Promise<QueueAhead> {
    const result = await this.queueAheadRepository.findOne({
      where: {},
      order: [['number', 'DESC']],
      limit: 1,
    });
    return result;
  }

  async getMinNumber(): Promise<QueueAhead> {
    const result = await this.queueAheadRepository.findOne({
      where: {},
      order: [['number', 'ASC']],
      limit: 1,
    });
    return result;
  }

  async getAllQueueAhead(): Promise<QueueAhead[]> {
    return await this.queueAheadRepository.findAll({
      order: [['id', 'ASC']],
    });
  }
}
