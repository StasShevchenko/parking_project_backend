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
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user.in_queue) {
      user.in_queue = true;
      user.save();
    }
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
    return await this.queueRepository.destroy({ where: { userId: userId } });
  }

  async changeActiveUser(user: User) {
    const period = 30;
    const nowDate = new Date();
    const millisecondsIn60Days = 60 * 24 * 60 * 60 * 1000;
    let end_active_time = new Date();
    end_active_time.setDate(nowDate.getDate() + period);
    const maxNumber = await this.getMaxNumber();

    const minUserId = (await this.getMinNumber()).userId;
    const minUser = await this.userRepository.findOne({
      where: { id: minUserId },
    });

    const last_active_period_minUser = new Date(minUser.last_active_period);
    const timeDifference = Math.abs(
      nowDate.getTime() - last_active_period_minUser.getTime(),
    );
    const activateMoreMonthAgo =
      timeDifference >= millisecondsIn60Days ? true : false;

    user.active = false;
    user.end_active_time = null;
    user.start_active_time = null;
    await user.save();

    // if (minUser.last_active_period == null || activateMoreMonthAgo) {
    await this.deleteFromQueue(minUser.id);
    await this.create({ userId: minUser.id });
    minUser.active = true;
    minUser.start_active_time = nowDate;
    minUser.end_active_time = end_active_time;
    minUser.last_active_period = nowDate;
    await minUser.save();
    // }
  }

  async CalculationNextAllUsersPeriods() {
    const users = await this.userRepository.findAll({
      where: { in_queue: true },
    });
    let result = {};
    for (const user of users) {
      const nextPeriod = await this.CalculationNextPeriod(user);
      result[user.id] = {
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        is_staff: user.is_staff,
        is_superuser: user.is_superuser,
        active: user.active,
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
    const firstPeriod = new Date();
    const secondPeriod = new Date();
    const thirdPeriod = new Date();
    const fourthPeriod = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const countQueue = await this.queueRepository.count();
    let periods = [];

    const positionUserFromQueue = (
      await this.queueRepository.findOne({ where: { userId: user.id } })
    ).number;
    const minNumberFromQueue = await this.queueRepository.findOne({
      where: {},
      order: [['number', 'ASC']],
      limit: 1,
    });

    const user_end_date = new Date(user.end_active_time);
    const day_left =
      (user_end_date.getTime() - nowDate.getTime()) / millisecondsPerDay;
    const periodCount = Math.floor(
      (positionUserFromQueue - minNumberFromQueue.number) / seats,
    );
    firstPeriod.setDate(
      nowDate.getDate() + day_left + periodCount * period + 1,
    );
    return firstPeriod.toISOString();
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
    const day_left =
      (user_active_end_data.getTime() - nowDate.getTime()) / millisecondsPerDay;
    const periodCount = Math.floor(
      (positionUserFromQueue - minNumberFromQueue.number) / seats,
    );
    nextPeriod.setDate(nowDate.getDate() + day_left + periodCount * period + 1);
    return nextPeriod.toISOString();
  }

  async getAllNextPeriods() {
    const usersInQueue = await this.queueRepository.findAll({
      order: [['number', 'ASC']],
    });
    let nextPeriods = [];
    let nextQueue = [...usersInQueue];
    let nowDate = new Date();
    let nextDate = new Date();
    nextDate.setDate(nowDate.getDate() + 30);

    for (let i = 0; i < 5; i++) {
      const lastThreeEntries = nextQueue.slice(-3);

      const lastThreeUsers = await Promise.all(
        lastThreeEntries.map(async (user) => {
          const myUser = await this.userRepository.findOne({
            where: { id: user.userId },
          });
          return myUser;
        }),
      );

      const nextPeriod = await lastThreeUsers.reduce((acc, user, index) => {
        acc[`user${index + 1} id`] = user.id;
        acc[`user${index + 1} firstName`] = user.firstName;
        acc[`user${index + 1} secondName`] = user.secondName;
        acc[`user${index + 1} email`] = user.email;
        return acc;
      }, {});

      nextPeriods.push({
        start_time: nowDate.toISOString(),
        end_time: nextDate.toISOString(),
        data: nextPeriod,
      });
      nextQueue = await this.generateNewQueue(nextQueue);
      nextDate.setDate(nextDate.getDate() + 30);
      nowDate.setDate(nowDate.getDate() + 30);
    }

    return nextPeriods;

    // for (let i = 0; i < 5; i++) {
    //   nowDate.setDate(nextDate.getDate());
    //   nextDate.setDate(nowDate.getDate() + 30);
    //   nextPeriods[nowDate.toISOString()] = {
    //     user1: nextQueue[0].id,
    //     user2: nextQueue[1].id,
    //     user3: nextQueue[2].id,
    //     end_time: nextDate.toISOString(),
    //   };
    //   console.log(nextQueue[1].id);
    //   console.log(nextQueue[2].id);
    //   console.log(nextQueue[3].id);
    //   nextQueue = await this.generateNewQueue(nextQueue);
    //   nowDate.setDate(nextDate.getDate());
    //   nextDate.setDate(nowDate.getDate() + 30);
    // }

    return nextPeriods;
  }

  async generateNewQueue(usersInQueue) {
    let maxNumber = 0;
    let usersToMove = [];

    // Create a shallow copy of usersInQueue
    const usersCopy = usersInQueue.slice();

    usersCopy.forEach((user) => {
      if (user.number > maxNumber) {
        maxNumber = user.number;
      }
    });

    usersToMove = usersCopy.splice(0, 3);

    const newQueue = [...usersCopy]; // Use the copied array

    for (let i = 0; i < 3; i++) {
      const user = usersToMove[i];
      const userId: number = user.userId;
      const newUser = {
        userId: userId,
        number: maxNumber + i + 1,
      };
      newQueue.push(newUser);
    }

    return newQueue;
  }
}
