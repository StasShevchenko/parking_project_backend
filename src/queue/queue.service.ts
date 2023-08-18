import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/modules/user/model/user.model';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';

@Injectable()
export class QueueService {
  async get(): Promise<Queue[]> {
    return this.queueRepository.findAll();
  }
  constructor(
    @InjectModel(Queue) private readonly queueRepository: typeof Queue,
    @InjectModel(User) private readonly userRepository: typeof User,
  ) {}

  async create(dto: CreateQueueDTO): Promise<Queue> {
    const maxNumber = await this.getMaxNumber();
    if (maxNumber) {
      return this.queueRepository.create({
        userId: dto.userId,
        number: maxNumber.number + 1,
      });
    }
    return this.queueRepository.create({
      userId: dto.userId,
      number: 1,
    });
  }

  async getMaxNumber(): Promise<Queue> {
    const result = await this.queueRepository.findOne({
      where: {},
      order: [['number', 'DESC']],
      limit: 1,
    });
    return result;
  }

  async getMinNumber(): Promise<Queue> {
    const result = await this.queueRepository.findOne({
      where: {},
      order: [['number', 'ASC']],
      limit: 1,
    });
    return result;
  }

  async CheckUserActivation() {
    const nowDate = new Date();
    const activeUsers = await this.userRepository.findAll({
      where: { active: true },
      // order: [['position', 'ASC']],
    });
    for (const user of activeUsers) {
      await this.changeActiveUser(user);
    }
  }

  async deleteFromQueue(userId: number) {
    console.log(`Delete user from Queue : ${userId}`);
    return await this.queueRepository.destroy({ where: { userId: userId } });
  }

  async changeActiveUser(user: User) {
    const period = 30;
    const nowDate = new Date();
    const millisecondsIn30Days = 30 * 24 * 60 * 60 * 1000;
    let end_active_time = new Date();
    end_active_time.setDate(nowDate.getDate() + period);

    const minUserId = (await this.getMinNumber()).userId;
    const minUser = await this.userRepository.findOne({
      where: { id: minUserId },
    });

    const last_active_period_minUser = new Date(minUser.last_active_period);
    const timeDifference = Math.abs(
      nowDate.getTime() - last_active_period_minUser.getTime(),
    );
    const activateMoreMonthAgo =
      timeDifference >= millisecondsIn30Days ? true : false;

    user.active = false;
    user.end_active_time = null;
    user.start_active_time = null;
    await user.save();
    await this.create({ userId: user.id });

    if (minUser.last_active_period == null || activateMoreMonthAgo) {
      await this.deleteFromQueue(minUser.id);
      minUser.active = true;
      minUser.start_active_time = nowDate;
      minUser.end_active_time = end_active_time;
      minUser.last_active_period = nowDate;
      await minUser.save();
    }
  }

  async CalculationNextAllUsersPeriods() {
    const users = await this.userRepository.findAll();
    let result = {};
    for (const user of users) {
      const nextPeriod = await this.CalculationNextPeriod(user);
      result[user.id] = {
        user: user,
        nextPeriod: nextPeriod,
      };
    }
    return result;
  }

  async calculationNextPeriodOneUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user.active) {
      return this.nextPeriodActiveUser(user);
    } else {
      return this.nextPeriodNoActiveUser(user);
    }
  }

  async CalculationNextPeriod(user: User) {
    if (user.active) {
      return await this.nextPeriodActiveUser(user);
    } else {
      return await this.nextPeriodNoActiveUser(user);
    }
  }

  async nextPeriodActiveUser(user: User) {
    let period = 30;
    const seats = 3;
    const nowDate = new Date();
    const nextPeriod = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const countQueue = await this.queueRepository.count();

    const user_end_date = new Date(user.end_active_time);
    const day_left =
      (user_end_date.getTime() - nowDate.getTime()) / millisecondsPerDay;
    const periodCount = Math.floor(countQueue / seats);
    nextPeriod.setDate(nowDate.getDate() + day_left + periodCount * period);
    return nextPeriod.toISOString();
  }

  async nextPeriodNoActiveUser(user: User) {
    let period = 30;
    const seats = 3;
    const nowDate = new Date();
    const nextPeriod = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const countQueue = await this.queueRepository.count();

    const positionUserFromQueue = (
      await this.queueRepository.findOne({ where: { userId: user.id } })
    ).number;
    const minNumberFromQueue = await this.queueRepository.findOne({
      where: {},
      order: [['number', 'ASC']],
      limit: 1,
    });
    const activeUser = await this.userRepository.findOne({
      where: {
        active: true,
      },
    });
    const user_active_end_data = new Date(activeUser.end_active_time);
    console.log(`user_active_end_data = ${user_active_end_data.toISOString()}`);
    const day_left =
      (user_active_end_data.getTime() - nowDate.getTime()) / millisecondsPerDay;
    console.log(`day_left = ${day_left}`);
    const periodCount = Math.floor(
      (positionUserFromQueue - minNumberFromQueue.number) / seats,
    );
    console.log(`positionUserFromQueue = ${positionUserFromQueue}`);
    console.log(`minNumberFromQueue.number = ${minNumberFromQueue.number}`);
    console.log(`periodCount = ${periodCount}`);
    nextPeriod.setDate(nowDate.getDate() + day_left + periodCount * period);
    console.log(`nextPeriod = ${nextPeriod.toISOString()}`);
    return nextPeriod.toISOString();
  }
}
