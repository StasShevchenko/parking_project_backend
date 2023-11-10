import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
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

  // При добавлении нового пользователя добавляем его перед активными
  async IncrementNumberActiveUsersAndGetMinNumber() {
    try {
      // Добавить чтобы следующий период +1 из-за нового юзера
      const allActiveUsersNow = await this.userRepository.findAll({
        where: { active: true },
      });

      if (allActiveUsersNow.length == 0) {
        return;
      }

      const userIds = allActiveUsersNow.map((user) => user.id);

      let activeUsersInQueue = await this.queueRepository.findAll({
        where: {
          userId: userIds,
        },
        order: [['number', 'ASC']],
      });

      let MinNumber = activeUsersInQueue[0].number;

      for (var user of activeUsersInQueue) {
        user.number++;
        await user.save();
      }
      return MinNumber;
    } catch (e) {
      console.log(e);
    }
  }

  async AddUserToQueue(dto: CreateQueueDTO): Promise<Queue> {
    try {
      const inputData = await this.inputDataRepository.findOne();
      const numberActiveUsers = (
        await this.userRepository.findAll({ where: { active: true } })
      ).length;

      // Получаем юзера из бд по userId из dto
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      const MaxNumber = await this.getMaxNumber();

      const nowDate = new Date();
      const end_time = new Date();
      end_time.setDate(end_time.getDate() + inputData.period);

      // Если кол-во активных юзеров меньше парковочных мест сразу активируем юзера
      if (numberActiveUsers < inputData.seats) {
        await this.ActivationUser(user);
      }

      // Если юзер только создан и еще не в очереди
      if (!user.in_queue) {
        user.in_queue = true;
        user.last_active_period = nowDate;
        user.save();

        // Если уже есть активные, то добавляем нового юзера перед ними и нужно поменять их периоды на +1 вперед
        if (numberActiveUsers >= inputData.seats) {
          const MinNumberActiveUser =
            await this.IncrementNumberActiveUsersAndGetMinNumber();
          //Если есть MinNumber
          if (MinNumberActiveUser) {
            return this.queueRepository.create({
              userId: dto.userId,
              number: MinNumberActiveUser,
              start_period_time: nowDate,
              end_period_time: end_time,
            });
          }
          // Если его нет
          return this.queueRepository.create({
            userId: dto.userId,
            number: 1,
            start_period_time: nowDate,
            end_period_time: end_time,
          });
        }
      }

      // Если у юзера поле last_active_period не задано
      if (!user.last_active_period) {
        user.last_active_period = nowDate;
      }

      if (MaxNumber) {
        return this.queueRepository.create({
          userId: dto.userId,
          number: MaxNumber + 1,
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
    } catch (e) {
      console.log(e);
    }
  }

  async getMaxNumber(): Promise<number> {
    try {
      const result = await this.queueRepository.findOne({
        where: {},
        order: [['number', 'DESC']],
        limit: 1,
      });

      return result ? result.number : null;
    } catch (e) {
      console.log(e);
    }
  }

  async getMinNumberUser(): Promise<Queue> {
    try {
      const result = await this.queueRepository.findOne({
        where: {},
        order: [['number', 'ASC']],
        limit: 1,
      });
      return result;
    } catch (e) {
      console.log(e);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async CheckUserActivation() {
    try {
    } catch (e) {
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
  }

  async deleteFromQueue(userId: number) {
    try {
      return await this.queueRepository.destroy({ where: { userId: userId } });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async changeActiveUser(user: User) {
    const minNumberUserId = (await this.getMinNumberUser()).userId;
    const minUser = await this.userRepository.findOne({
      where: { id: minNumberUserId },
    });

    user.active = false;
    user.end_active_time = null;
    user.start_active_time = null;
    user.next_active = null;
    user.previous_active = null;
    await user.save();

    await this.deleteFromQueue(minUser.id);
    await this.AddUserToQueue({ userId: minUser.id });
    await this.ActivationUser(minUser);
  }

  async ActivationUser(user: User) {
    const nowDate = new Date();
    let endDate = new Date();
    endDate.setMonth(nowDate.getMonth() + 1);
    user.active = true;
    user.start_active_time = nowDate;
    user.end_active_time = endDate;
    user.last_active_period = nowDate;
    user.next_active = null;
    user.previous_active = null;
    await user.save();
  }

  // Для всех пользователей
  async GetThisPeriodQueue(): Promise<Queue[]> {
    // Сейчас активные, они пойдут первые + их start_time точка отсчета
    const NowActiveUsers = await this.userRepository.findAll({
      where: { active: true },
    });
    let nowDate = new Date(NowActiveUsers[0].start_active_time);
    let nextDate = new Date(NowActiveUsers[0].start_active_time);

    const inputData = await this.inputDataRepository.findOne();
    // Вся очередь
    const usersInQueue = await this.queueRepository.findAll({
      order: [['number', 'ASC']],
    });
    let Period = [];
    let nextUsers = [];
    let flag_users_count = 0; // Для того, чтобы помещать юзеров в разные месяцы
    let flag_periods = 1; // Сколько месяцев добавляем для start_period_time

    // Сдесь добавить в Period активных сейчас юзеров

    for (let user of NowActiveUsers) {
      const nextUser = {
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        active: user.active,
        id: user.id,
        avatar: user.avatar,
      };
      nextUsers.push(nextUser);
    }
    let nextPeriodForActiveUsers = {
      start_time: nowDate.toISOString(),
      end_time: nextDate.toISOString(),
      nextUsers,
    };
    Period.push(nextPeriodForActiveUsers);
    nextUsers = [];

    for (let queueItem of usersInQueue) {
      flag_users_count++;
      // Чтобы последних активных не выводить дважды
      if (flag_users_count <= usersInQueue.length - inputData.seats) {
        let user = await this.userRepository.findByPk(queueItem.userId);
        const nextUser = {
          firstName: user.firstName,
          secondName: user.secondName,
          email: user.email,
          active: user.active,
          id: user.id,
          avatar: user.avatar,
        };
        nextUsers.push(nextUser);
        // Если пора переходить к следующему периоду
        if (flag_users_count % inputData.seats == 0) {
          nowDate.setMonth(nowDate.getMonth() + 1);
          nextDate.setMonth(nowDate.getMonth() + 1);
          const nextPeriod = {
            start_time: nowDate.toISOString(),
            end_time: nextDate.toISOString(),
            nextUsers,
          };
          Period.push(nextPeriod);
          nextUsers = [];
        }
      } else {
        nowDate.setMonth(nowDate.getMonth() + 1);
        nextDate.setMonth(nowDate.getMonth() + 1);
        const nextPeriod = {
          start_time: nowDate.toISOString(),
          end_time: nextDate.toISOString(),
          nextUsers,
        };
        Period.push(nextPeriod);
        break;
      }
    }

    return Period;
  }

  // Для администраторов
  async GetOneNextPeriod(): Promise<Queue[]> {
    // Сейчас активные, они пойдут первые + их start_time точка отсчета
    const NowActiveUsers = await this.userRepository.findAll({
      where: { active: true },
    });
    let nowDate = new Date(NowActiveUsers[0].start_active_time);
    let nextDate = new Date(NowActiveUsers[0].start_active_time);
    nextDate.setMonth(nowDate.getMonth() + 1);

    const inputData = await this.inputDataRepository.findOne();
    // Вся очередь
    const usersInQueue = await this.queueRepository.findAll({
      order: [['number', 'ASC']],
    });
    let Period = [];
    let nextUsers = [];
    let flag_users_count = 0; // Для того, чтобы помещать юзеров в разные месяцы
    // Сдесь добавить в Period активных сейчас юзеров

    for (let user of NowActiveUsers) {
      const nextUser = {
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        active: user.active,
        id: user.id,
        avatar: user.avatar,
      };
      nextUsers.push(nextUser);
    }
    let nextPeriodForActiveUsers = {
      start_time: nowDate.toISOString(),
      end_time: nextDate.toISOString(),
      nextUsers,
    };
    Period.push(nextPeriodForActiveUsers);
    nextUsers = [];

    for (let a = 0; a < 3; a++) {
      for (let queueItem of usersInQueue) {
        flag_users_count++;
        let user = await this.userRepository.findByPk(queueItem.userId);
        const nextUser = {
          firstName: user.firstName,
          secondName: user.secondName,
          email: user.email,
          active: user.active,
          id: user.id,
          avatar: user.avatar,
        };
        nextUsers.push(nextUser);
        // Если пора переходить к следующему периоду
        if (flag_users_count % inputData.seats == 0) {
          nowDate.setMonth(nowDate.getMonth() + 1);
          nextDate.setMonth(nowDate.getMonth() + 1);
          const nextPeriod = {
            start_time: nowDate.toISOString(),
            end_time: nextDate.toISOString(),
            nextUsers,
          };
          Period.push(nextPeriod);
          nextUsers = [];
        }
      }
    }

    return Period;
  }
}
