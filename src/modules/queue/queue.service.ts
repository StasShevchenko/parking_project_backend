import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Period } from 'src/interfaces/period.interface';
import { User } from 'src/modules/user/model/user.model';
import { InputData } from '../input-data/model/input-data.model';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(Queue) private readonly queueRepository: typeof Queue,
    @InjectModel(InputData)
    private readonly inputDataRepository: typeof InputData,
    @InjectModel(User) private readonly userRepository: typeof User,
  ) {}

  async create(dto: CreateQueueDTO): Promise<Queue> {
    const maxNumber = await this.getMaxNumber();
    const nowDate = new Date();
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user.in_queue) {
      user.in_queue = true;
      user.last_active_period = nowDate;
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
    const period = (await this.inputDataRepository.findOne()).period;
    const nowDate = new Date();
    const millisecondsInNDays = period * 2 * 24 * 60 * 60 * 1000;
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
      timeDifference >= millisecondsInNDays ? true : false;

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

  async nextPeriodActiveUser(user: User) {
    let period = 30;
    const seats = 3;
    const nowDate = new Date();
    const nextPeriod = new Date();
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
    nextPeriod.setDate(nowDate.getDate() + day_left + periodCount * period + 1);
    return nextPeriod.toISOString();
  }

  async nextPeriodNoActiveUser(user: User) {
    const period = (await this.inputDataRepository.findOne()).period;
    const seats = 3;
    const nowDate = new Date();
    const start_time = new Date();
    const end_time = new Date();
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
    start_time.setDate(nowDate.getDate() + day_left + periodCount * period + 1);
    end_time.setDate(
      nowDate.getDate() + day_left + periodCount * period + 1 + period,
    );
    return { start_active_time: start_time, end_active_time: end_time };
  }

  async getAllNextPeriods(): Promise<Period[]> {
    const nowDate = (
      await this.userRepository.findOne({ where: { active: true } })
    ).start_active_time;
    const inputData = await this.inputDataRepository.findOne();
    const usersInQueue = await this.queueRepository.findAll({
      order: [['number', 'ASC']],
    });
    let nextPeriods = [];
    let nextQueue = [...usersInQueue];

    let nextDate = new Date();
    nextDate.setDate(nowDate.getDate() + inputData.period);

    for (let i = 0; i < inputData.numberOfOutputPeriods; i++) {
      let nextUsers = [];
      const lastThreeEntries = nextQueue.slice(-inputData.seats);

      const lastThreeUsers = await Promise.all(
        lastThreeEntries.map(async (user) => {
          const myUser = await this.userRepository.findOne({
            where: { id: user.userId },
          });
          return myUser;
        }),
      );

      for (const user of lastThreeUsers) {
        const nextUser = {
          firstName: user.firstName,
          secondName: user.secondName,
          email: user.email,
          active: user.active,
          id: user.id,
        };
        nextUsers.push(nextUser);
      }

      const nextPeriod = {
        start_time: nowDate.toISOString(),
        end_time: nextDate.toISOString(),
        nextUsers,
      };
      nextPeriods.push(nextPeriod);
      nextQueue = await this.generateNewQueue(nextQueue);
      nextDate.setDate(nextDate.getDate() + inputData.period);
      nowDate.setDate(nowDate.getDate() + inputData.period);
    }

    return nextPeriods;
  }

  async filterNextPeriods(firstName, secondName): Promise<Period[]> {
    const nextPeriods = await this.getAllNextPeriods();
    const filteredData = await this.getPeriodsByUser(
      firstName,
      secondName,
      nextPeriods,
    );
    return filteredData;
  }

  async generateNewQueue(usersInQueue) {
    const seats = (await this.inputDataRepository.findOne()).seats;
    let maxNumber = 0;
    let usersToMove = [];

    const usersCopy = usersInQueue.slice();

    usersCopy.forEach((user) => {
      if (user.number > maxNumber) {
        maxNumber = user.number;
      }
    });

    usersToMove = usersCopy.splice(0, seats);

    const newQueue = [...usersCopy];

    for (let i = 0; i < seats; i++) {
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

  getPeriodsByUser(firstName, secondName, periods: Period[]): Period[] {
    console.log(firstName);
    console.log(secondName);
    return periods
      .filter((period) =>
        period.nextUsers.some(
          (user) =>
            user.firstName.includes(firstName) ||
            user.secondName.includes(secondName) ||
            user.secondName.includes(firstName),
        ),
      )
      .map((period) => {
        return {
          ...period,
          nextUsers: period.nextUsers.filter(
            (user) =>
              user.firstName.includes(firstName) ||
              user.secondName.includes(secondName) ||
              user.secondName.includes(firstName),
          ),
        };
      });
  }
}
