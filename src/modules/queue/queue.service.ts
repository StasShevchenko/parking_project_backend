import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Period } from 'src/interfaces/period.interface';
import { User } from 'src/modules/user/model/user.model';
import { combinedLogger } from 'src/utils/logger.config';
import { InputData } from '../input-data/model/input-data.model';
import { QueueAheadService } from '../queue-ahead/queue-ahead.service';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(Queue) private readonly queueRepository: typeof Queue,
    @InjectModel(InputData)
    private readonly inputDataRepository: typeof InputData,
    @InjectModel(User) private readonly userRepository: typeof User,
    private readonly queueAheadService: QueueAheadService,
  ) {}
  private readonly logger = new Logger(QueueService.name);

  async create(dto: CreateQueueDTO): Promise<Queue> {
    const maxNumber = await this.getMaxNumber();
    console.log(dto);
    const inputData = await this.inputDataRepository.findOne();
    const nowDate = new Date();
    const end_time = new Date();
    end_time.setDate(end_time.getDate() + inputData.period);
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    const numberActiveUsers = (
      await this.userRepository.findAll({ where: { active: true } })
    ).length;
    if (numberActiveUsers < inputData.seats) {
      await this.ActivationUser(user, inputData.period);
    }

    if (!user.in_queue) {
      user.in_queue = true;
      user.last_active_period = nowDate;
      user.save();
      const queue = await this.getQueue();
      // await this.queueAheadService.generateNewQueue(user.id, queue);
    }
    if (!user.last_active_period) {
      user.last_active_period = nowDate;
    }
    // await this.queueAheadService.addUser(user.id);
    if (maxNumber) {
      return this.queueRepository.create({
        userId: dto.userId,
        number: maxNumber.number + 1,
        start_period_time: nowDate,
        end_period_time: end_time,
      });
    }
    return this.queueRepository.create({
      userId: dto.userId,
      number: 1,
      start_period_time: nowDate,
      end_period_time: end_time,
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

  // @Interval(1000)
  async CheckUserActivation() {
    const nowDate = new Date();
    const activeUsers = await this.userRepository.findAll({
      where: { active: true },
    });
    combinedLogger.info({ Message: 'Сдвиг очереди' });
    for (const user of activeUsers) {
      if (nowDate > user.end_active_time) {
        await this.changeActiveUser(user);
      }
    }
  }

  async deleteFromQueue(userId: number) {
    try {
      return await this.queueRepository.destroy({ where: { userId: userId } });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async changeActiveUser(user: User) {
    const period = (await this.inputDataRepository.findOne()).period;
    const nowDate = new Date();
    const millisecondsInNDays = period * 2 * 24 * 60 * 60 * 1000;

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

    await this.deleteFromQueue(minUser.id);
    await this.create({ userId: minUser.id });
    await this.ActivationUser(minUser, period);
  }

  async ActivationUser(user: User, period: number) {
    const nowDate = new Date();
    let end_active_time = new Date();
    end_active_time.setDate(nowDate.getDate() + period);
    user.active = true;
    user.start_active_time = nowDate;
    user.end_active_time = end_active_time;
    user.last_active_period = nowDate;
    await user.save();
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
    let flag = 0;

    for (let i = 0; i < inputData.numberOfOutputPeriods; i++) {
      let nextUsers = [];
      let activeUsers;
      if (flag < 1) {
        activeUsers = await this.userRepository.findAll({
          where: { active: true },
        });
        console.log('Dadadadadada');
        flag++;
      } else {
        const lastEntries = nextQueue.slice(-inputData.seats);

        activeUsers = await Promise.all(
          lastEntries.map(async (user) => {
            const myUser = await this.userRepository.findOne({
              where: { id: user.userId },
            });
            return myUser;
          }),
        );
      }

      for (const user of activeUsers) {
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
      if (usersToMove[i]) {
        const user = usersToMove[i];
        console.log(user.userId);
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

  getPeriodsByUser(firstName: string, secondName: string, periods) {
    firstName = firstName.toLowerCase();
    if (secondName) {
      secondName = secondName.toLowerCase();
    }

    return periods
      .filter((period) =>
        period.nextUsers.some(
          (user) =>
            user.firstName.toLowerCase().includes(firstName) ||
            user.secondName.toLowerCase().includes(secondName) ||
            user.secondName.toLowerCase().includes(firstName),
        ),
      )
      .map((period) => {
        return {
          ...period,
          nextUsers: period.nextUsers.filter(
            (user) =>
              user.firstName.toLowerCase().includes(firstName) ||
              user.secondName.toLowerCase().includes(secondName) ||
              user.secondName.toLowerCase().includes(firstName),
          ),
        };
      });
  }

  async getQueue(): Promise<Queue[]> {
    const queue = await this.queueRepository.findAll({
      order: [['number', 'ASC']],
    });
    return queue;
  }
}
