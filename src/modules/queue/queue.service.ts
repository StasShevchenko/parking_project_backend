import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Period } from 'src/interfaces/period.interface';
import { User } from '../user/model/user.model';
import { combinedLogger } from '../../utils/logger.config';
import { InputData } from '../input-data/model/input-data.model';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';
import { UserInPeriod } from '../../interfaces/user.interface';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(Queue) private readonly queueRepository: typeof Queue,
    @InjectModel(InputData)
    private readonly inputDataRepository: typeof InputData,
    @InjectModel(User) private readonly userRepository: typeof User,
  ) {}

  // При добавлении нового пользователя добавляем его перед активными
  async incrementNumberActiveUsersAndGetMinNumber(): Promise<number> {
    try {
      // Добавить чтобы следующий период +1 из-за нового юзера
      const allActiveUsersNow = await this.userRepository.findAll({
        where: { active: true },
      });

      if (allActiveUsersNow.length == 0) {
        return null;
      }

      const userIds = allActiveUsersNow.map((user) => user.id);

      const activeUsersInQueue = await this.queueRepository.findAll({
        where: {
          userId: userIds,
        },
        order: [['number', 'ASC']],
      });

      const minActiveUserNumber = activeUsersInQueue[0].number;
      for (const user of activeUsersInQueue) {
        user.number++;
        await user.save();
      }
      return minActiveUserNumber;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async addUserToQueue(dto: CreateQueueDTO): Promise<Queue> {
    try {
      const inputData = await this.inputDataRepository.findOne();
      const numberActiveUsers = (
        await this.userRepository.findAll({ where: { active: true } })
      ).length;

      // Получаем юзера из бд по userId из dto
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      const maxNumber = await this.getMaxNumber();

      const nowDate = new Date();
      const end_time = new Date();
      end_time.setDate(end_time.getDate() + inputData.period);

      // Если кол-во активных юзеров меньше парковочных мест сразу активируем юзера
      if (numberActiveUsers < inputData.seats) {
        await this.activateUser(user);
      }
      // Если юзер только создан и еще не в очереди
      if (!user.in_queue) {
        user.in_queue = true;
        user.last_active_period = nowDate;
        await user.save();
        // Если уже есть активные, то добавляем нового юзера перед ними и нужно поменять их периоды на +1 вперед
        if (numberActiveUsers >= inputData.seats) {
          let minActiveUserNumber =
            await this.incrementNumberActiveUsersAndGetMinNumber();
          minActiveUserNumber = minActiveUserNumber ?? 1;
          //Если есть MinNumber
          return this.queueRepository.create({
            userId: dto.userId,
            number: minActiveUserNumber,
            start_period_time: nowDate,
            end_period_time: end_time,
          });
        }
      }
      // Если у юзера поле last_active_period не задано
      if (!user.last_active_period) {
        user.last_active_period = nowDate;
      }
      if (maxNumber) {
        return this.queueRepository.create({
          userId: dto.userId,
          number: maxNumber + 1,
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
      return null;
    }
  }

  async getMaxNumber(): Promise<number> {
    try {
      const result = await this.queueRepository.findOne({
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
      return await this.queueRepository.findOne({
        where: {},
        order: [['number', 'ASC']],
        limit: 1,
      });
    } catch (e) {
      console.log(e);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async checkUserActivation() {
    try {
      const activeUsers = await this.userRepository.findAll({
        where: { active: true },
      });
      combinedLogger.info({ Message: 'Сдвиг очереди' });
      for (const user of activeUsers) {
        await this.changeActiveUser(user);
      }
    } catch (e) {
      console.log(e);
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
    try {
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
      await this.addUserToQueue({ userId: minUser.id });
      await this.activateUser(minUser);
    } catch (e) {
      console.log(e);
    }
  }

  async activateUser(user: User) {
    try {
      const nowDate = new Date();
      const endDate = new Date();
      endDate.setMonth(nowDate.getMonth() + 1);
      user.active = true;
      user.start_active_time = nowDate;
      user.end_active_time = endDate;
      user.last_active_period = nowDate;
      user.next_active = null;
      user.previous_active = null;
      await user.save();
    } catch (e) {
      console.log(e);
    }
  }

  async getThisQueuePeriodCopy(): Promise<Period[]>{
    return []
  }
  // Для всех пользователей
  async getThisQueuePeriod(): Promise<Period[]> {
    try {
      // Сейчас активные, они пойдут первые + их start_time точка отсчета
      const nowActiveUsers = await this.userRepository.findAll({
        where: { active: true },
      });
      const nowDate = new Date(nowActiveUsers[0].start_active_time);
      const nextDate = new Date(nowActiveUsers[0].start_active_time);

      const inputData = await this.inputDataRepository.findOne();
      // Вся очередь
      const usersInQueue = await this.queueRepository.findAll({
        order: [['number', 'ASC']],
      });
      const period = [];
      let nextUsers = [];
      let flag_users_count = 0; // Для того, чтобы помещать юзеров в разные месяцы

      // Сдесь добавить в period активных сейчас юзеров

      for (const user of nowActiveUsers) {
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
      const nextPeriodForActiveUsers = {
        start_time: nowDate.toISOString(),
        end_time: nowActiveUsers[0].end_active_time,
        nextUsers,
      };
      period.push(nextPeriodForActiveUsers);
      nextUsers = [];

      for (const queueItem of usersInQueue) {
        flag_users_count++;
        // Чтобы последних активных не выводить дважды
        if (flag_users_count <= usersInQueue.length - inputData.seats) {
          const user = await this.userRepository.findByPk(queueItem.userId);
          const nextUser = {
            firstName: user.firstName,
            secondName: user.secondName,
            email: user.email,
            active: user.active,
            id: user.id,
            avatar: user.avatar,
            swap: queueItem.swap,
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
            period.push(nextPeriod);
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
          period.push(nextPeriod);
          break;
        }
      }
      return period;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  // Для администраторов
  async getOneNextPeriod(): Promise<Queue[]> {
    try {
      // Сейчас активные, они пойдут первые + их start_time точка отсчета
      const NowActiveUsers = await this.userRepository.findAll({
        where: { active: true },
      });
      const nowDate = new Date(NowActiveUsers[0].start_active_time);
      const nextDate = new Date(NowActiveUsers[0].start_active_time);
      nextDate.setMonth(nowDate.getMonth() + 1);

      const inputData = await this.inputDataRepository.findOne();
      // Вся очередь
      const usersInQueue = await this.queueRepository.findAll({
        order: [['number', 'ASC']],
      });
      let Period = [];
      const AllPeriods = [];
      let nextUsers = [];
      let flag_users_count = 0; // Для того, чтобы помещать юзеров в разные месяцы
      // Сдесь добавить в Period активных сейчас юзеров

      for (const user of NowActiveUsers) {
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
      const nextPeriodForActiveUsers = {
        start_time: nowDate.toISOString(),
        end_time: nextDate.toISOString(),
        nextUsers,
      };
      Period.push(nextPeriodForActiveUsers);
      nextUsers = [];

      for (let a = 0; a < 3; a++) {
        // Чтобы в AllPeriods записались нынешние активные
        if (a > 0) {
          Period = [];
        }

        for (const queueItem of usersInQueue) {
          flag_users_count++;
          const user = await this.userRepository.findByPk(queueItem.userId);
          const nextUser = {
            firstName: user.firstName,
            secondName: user.secondName,
            email: user.email,
            active: user.active,
            id: user.id,
            avatar: user.avatar,
            swap: queueItem.swap,
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
        AllPeriods.push(Period);
      }
      return AllPeriods;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async GetNextPeriodsForOneUser(dto: CreateQueueDTO) {
    try {
      // Сейчас активные, они пойдут первые + их start_time точка отсчета
      const NowActiveUsers = await this.userRepository.findAll({
        where: { active: true },
      });
      // Пользователь, для которого ищем следующие периоды
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      const nowDate = new Date(NowActiveUsers[0].start_active_time);
      const nextDate = new Date(NowActiveUsers[0].start_active_time);
      nextDate.setMonth(nowDate.getMonth() + 1);

      const inputData = await this.inputDataRepository.findOne();
      // Вся очередь
      const usersInQueue = await this.queueRepository.findAll({
        order: [['number', 'ASC']],
      });
      const Period = [];
      let nextUsers = [];
      let flag_users_count = 0; // Для того, чтобы помещать юзеров в разные месяцы
      // Сдесь добавить в Period активных сейчас юзеров

      // Если наш пользователь активен, то сразу кидаем ему текущий период
      if (user.active) {
        const nextUser = {
          firstName: user.firstName,
          secondName: user.secondName,
          email: user.email,
          active: user.active,
          id: user.id,
          avatar: user.avatar,
        };
        nextUsers.push(nextUser);

        const nextPeriodForActiveUsers = {
          start_time: nowDate.toISOString(),
          end_time: nextDate.toISOString(),
          nextUsers,
        };
        Period.push(nextPeriodForActiveUsers);
        nextUsers = [];
      }

      // Получаем еще 5 его следущих периодов активации
      for (let a = 0; a < 5; a++) {
        for (const queueItem of usersInQueue) {
          flag_users_count++;
          // Если мы попали на нашего юзера, то добавляем его в nextUser
          if (queueItem.userId == dto.userId) {
            const user = await this.userRepository.findByPk(queueItem.userId);
            const nextUser = {
              firstName: user.firstName,
              secondName: user.secondName,
              email: user.email,
              active: user.active,
              id: user.id,
              avatar: user.avatar,
              swap: queueItem.swap,
            };
            nextUsers.push(nextUser);
          }

          // Если пора переходить к следующему периоду
          if (flag_users_count % inputData.seats == 0) {
            nowDate.setMonth(nowDate.getMonth() + 1);
            nextDate.setMonth(nowDate.getMonth() + 1);
            // Если наш юзер есть в nextUsers, то выводим этот период
            if (nextUsers.length != 0) {
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
      }
      return Period;
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async SwapUsers(senderId: number, receiverId: number): Promise<boolean> {
    try {
      const senderInQueue: Queue = await this.queueRepository.findOne({
        where: { userId: senderId },
      });
      const receiverInQueue: Queue = await this.queueRepository.findOne({
        where: { userId: receiverId },
      });
      const senderNumber: number = senderInQueue.number;
      senderInQueue.number = receiverInQueue.number;
      senderInQueue.swap = receiverInQueue.userId;
      receiverInQueue.number = senderNumber;
      receiverInQueue.swap = senderInQueue.userId;
      await senderInQueue.save();
      await receiverInQueue.save();
      return true;
    } catch (e) {
      console.log(e);
    }
  }

  async filterOneNextPeriods(firstName, secondName): Promise<Period[]> {
    try {
      const nextPeriods = await this.getOneNextPeriod();

      const filteredPeriods = [];
      for (let i = 0; i < nextPeriods.length; i++) {
        filteredPeriods.push(
          this.filterPeriods(firstName, secondName, nextPeriods[i]),
        );
      }
      return filteredPeriods;
    } catch (e) {
      console.log(e);
    }
  }

  async filterThisPeriods(firstName, secondName): Promise<Period[]> {
    try {
      const nextPeriods = await this.getThisQueuePeriod();
      const filteredData = await this.filterPeriods(
        firstName,
        secondName,
        nextPeriods,
      );
      return filteredData;
    } catch (e) {
      console.log(e);
    }
  }

  filterPeriods(firstName: string, secondName: string, periods) {
    try {
      const lowerFirstName = firstName.toLowerCase();
      const lowerSecondName = secondName ? secondName.toLowerCase() : '';

      return periods
        .filter((period) =>
          period.nextUsers.some((user) => {
            const lowerUserFirstName = user.firstName.toLowerCase();
            const lowerUserSecondName = user.secondName
              ? user.secondName.toLowerCase()
              : '';

            // Проверяем совпадение хотя бы в одном из случаев: имя-имя, имя-фамилия, фамилия-имя, фамилия-фамилия
            return (
              (lowerUserFirstName.includes(lowerFirstName) &&
                lowerUserSecondName.includes(lowerSecondName)) ||
              (lowerUserFirstName.includes(lowerSecondName) &&
                lowerUserSecondName.includes(lowerFirstName))
            );
          }),
        )
        .map((period) => {
          return {
            ...period,
            nextUsers: period.nextUsers.filter((user) => {
              const lowerUserFirstName = user.firstName.toLowerCase();
              const lowerUserSecondName = user.secondName
                ? user.secondName.toLowerCase()
                : '';

              // Повторяем те же проверки внутри map
              return (
                (lowerUserFirstName.includes(lowerFirstName) &&
                  lowerUserSecondName.includes(lowerSecondName)) ||
                (lowerUserFirstName.includes(lowerSecondName) &&
                  lowerUserSecondName.includes(lowerFirstName))
              );
            }),
          };
        });
    } catch (e) {
      console.log(e);
    }
  }

  async nextPeriodActiveUser(user: User) {
    try {
      const period = 30;
      const seats = 3;
      const nowDate = new Date();
      const nextPeriod = new Date();
      const millisecondsPerDay = 24 * 60 * 60 * 1000;

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
      nextPeriod.setDate(
        nowDate.getDate() + day_left + periodCount * period + 1,
      );
      return nextPeriod.toISOString();
    } catch (e) {
      console.log(e);
    }
  }

  async nextPeriodNoActiveUser(user: User) {
    try {
      const INPUT_DATA = await this.inputDataRepository.findOne();
      const seats = INPUT_DATA.seats;

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

      const start_time = new Date(user_active_end_data);
      const end_time = new Date(start_time);

      const periodCount = Math.floor(
        (positionUserFromQueue - minNumberFromQueue.number) / seats,
      );
      start_time.setMonth(start_time.getMonth() + periodCount);
      end_time.setMonth(start_time.getMonth() + 1);
      return { start_active_time: start_time, end_active_time: end_time };
    } catch (e) {
      console.log(e);
    }
  }
}
