import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Period } from 'src/interfaces/period.interface';
import { User } from '../user/model/user.model';
import { combinedLogger } from '../../utils/logger.config';
import { InputData } from '../input-data/model/input-data.model';
import { CreateQueueDTO } from './dto/create-queue.dto';
import { Queue } from './model/queue.model';
import {
  mapToUserInPeriod,
  UserInPeriod,
} from '../../interfaces/user.interface';
import { Op } from 'sequelize';
import {resetDate} from "./utils/resetDate";
export * from 'src/interfaces/period.interface';
@Injectable()
export class QueueService implements OnModuleInit {
  constructor(
    @InjectModel(Queue) private readonly queueRepository: typeof Queue,
    @InjectModel(InputData)
    private readonly inputDataRepository: typeof InputData,
    @InjectModel(User) private readonly userRepository: typeof User,
  ) {}

  async addUserToQueue(dto: CreateQueueDTO): Promise<Queue> {
    try {
      const inputData = await this.inputDataRepository.findOne();
      const queueUsers = await this.userRepository.findAll({
        where: { queueUser: true },
        order: [['startActiveTime', 'ASC']],
      });
      // Получаем юзера из бд по userId из dto
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      // Если юзер только создан и еще не в очереди
      if (!user.queueUser) {
        let isActive = false;
        if (queueUsers.length < inputData.seats) {
          isActive = true;
        }
        let startDate = resetDate(new Date());
        let endDate = resetDate(new Date());
        //Если в очереди еще нет юзеров, то выставляем срок на месяц
        //от начала текущего месяца
        if (queueUsers.length == 0) {
          endDate.setMonth(startDate.getMonth() + 1);
          endDate.setDate(endDate.getDate() - 1);
          const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
          startDate = new Date(startDate.getTime() - userTimezoneOffset);
          endDate = new Date(endDate.getTime() - userTimezoneOffset);
        } // Если не делится на число мест, то значит в этом
        //месяце еще остались места и сроки как у последнего юзера в очереди
        else if (queueUsers.length % inputData.seats != 0) {
          const lastUser = queueUsers[queueUsers.length - 1];
          startDate = lastUser.startActiveTime;
          endDate = lastUser.endActiveTime;
        } else {
          // В этом месяце нет мест, значит сроки рассчитываем на след месяц
          const lastUserStartDate =
            queueUsers[queueUsers.length - 1].startActiveTime;
          startDate.setMonth(lastUserStartDate.getMonth() + 1);
          endDate.setMonth(startDate.getMonth() + 1);
          endDate.setDate(endDate.getDate() - 1);
          const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
          startDate = new Date(startDate.getTime() - userTimezoneOffset);
          endDate = new Date(endDate.getTime() - userTimezoneOffset);
        }

        user.queueUser = true;
        user.active = isActive;
        user.lastActivePeriod = startDate;
        user.startActiveTime = startDate;
        user.endActiveTime = endDate;
        await user.save();
        return await this.queueRepository.create({
          userId: dto.userId,
          number: (await this.getMaxNumber()) + 1,
          start_period_time: startDate,
          end_period_time: endDate,
        });
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async changeActiveUsers(): Promise<Date> {
    try {
      combinedLogger.info({ Message: 'Сдвиг очереди' });
      const inputData = await this.inputDataRepository.findOne();
      const queueUsers = await this.userRepository.findAll({
        where: { queueUser: true },
        order: [
          ['startActiveTime', 'ASC'],
          ['active', 'DESC'],
        ],
      });
      if (queueUsers.length <= inputData.seats) return null;
      const currentDate = resetDate(new Date());
      if (queueUsers[0].startActiveTime.getMonth() >= currentDate.getMonth())
        return null;
      const moveCount = inputData.seats;
      //Продвигаем очередь вперед на нужное число мест

      //Переменная для хранения текущего юзера
      let currentUser: User = null;

      //Переменная для хранения следующего юзера
      let nextUser: User = null;

      for (let j = 0; j < moveCount; j++) {
        for (let i = 0; i < queueUsers.length; i++) {
          //Делаем предыдущих юзеров НЕ активными
          if (j == 0 && i < inputData.seats) {
            queueUsers[i].active = false;
            await queueUsers[i].save();
          }
          currentUser = queueUsers[queueUsers.length - 1 - i];
          queueUsers[queueUsers.length - i - 1] =
            nextUser ??
            this.getNextElement(queueUsers.length - i - 1, 1, queueUsers);
          nextUser = currentUser;
          //Обновляем номера в очереди на последней итерации
          if (j == moveCount - 1) {
            const userQueueEntry = await this.queueRepository.findOne({
              where: { userId: queueUsers[queueUsers.length - i - 1].id },
            });
            userQueueEntry.number = queueUsers.length - i;
            await userQueueEntry.save();
            //Делаем новых юзеров активными
            if (i < inputData.seats) {
              queueUsers[moveCount - i].active = true;
              userQueueEntry.swap = null;
              await userQueueEntry.save();
              await queueUsers[moveCount - i].save();
            }
          }
        }
        nextUser = null;
      }
      for (let i = 0; i < queueUsers.length; i++) {
        if (i > inputData.seats - 1 - (queueUsers.length % inputData.seats)) {
          const lastStartDate = new Date(queueUsers[i - 1].startActiveTime);
          if (i % inputData.seats == 0) {
            lastStartDate.setMonth(lastStartDate.getMonth() + 1);
          }
          queueUsers[i].startActiveTime = lastStartDate;
          const endTime = new Date(queueUsers[i].startActiveTime);
          endTime.setMonth(endTime.getMonth() + 1);
          endTime.setDate(endTime.getDate() - 1);
          queueUsers[i].endActiveTime = endTime;
          queueUsers[i].lastActivePeriod = endTime;
          await queueUsers[i].save();
        }
      }
      return queueUsers[0].startActiveTime;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  //Функция для получения следующего элемента массива
  getNextElement(currentIndex: number, step: number, array: any[]): any {
    if (currentIndex + step >= array.length) return array[0];
    else {
      return array[currentIndex + step];
    }
  }

  async deleteFromQueue(userId: number) {
    try {
      let queueUsers = await this.userRepository.findAll({
        where: { queueUser: true },
        order: [
          ['startActiveTime', 'ASC'],
          ['active', 'DESC'],
        ],
      });
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const inputData = await this.inputDataRepository.findOne();
      const userIndex = queueUsers.findIndex((it) => it.id == user.id);
      user.queueUser = false;
      user.active = false;
      user.lastActivePeriod = null;
      user.startActiveTime = null;
      user.endActiveTime = null;
      await user.save();
      await this.queueRepository.destroy({ where: { userId: userId } });
      queueUsers = queueUsers.filter((it) => it.email !== user.email);
      //Необходимо переназначить даты
      if (queueUsers.length > 1 && userIndex != queueUsers.length - 1) {
        for (let i = userIndex; i < queueUsers.length; i++) {
          if (i < inputData.seats) {
            queueUsers[i].active = true;
          }
          if (i > 0) {
            const lastStartDate = new Date(queueUsers[i - 1].startActiveTime);
            if (i % inputData.seats == 0) {
              lastStartDate.setMonth(lastStartDate.getMonth() + 1);
            }
            const queueItem = await this.queueRepository.findOne({
              where: { userId: queueUsers[i].id },
            });
            queueItem.number = i + 1;
            await queueItem.save();
            queueUsers[i].startActiveTime = lastStartDate;
            const endTime = new Date(queueUsers[i].startActiveTime);
            endTime.setMonth(endTime.getMonth() + 1);
            endTime.setDate(endTime.getDate() - 1);
            queueUsers[i].endActiveTime = endTime;
            queueUsers[i].lastActivePeriod = endTime;
          }
          await queueUsers[i].save();
        }
        return;
      } else return;
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async getCurrentQueuePeriod(fullName: string = ''): Promise<Period[]> {
    try {
      let firstName: string;
      let secondName: string;
      if (fullName.includes(' ')) {
        firstName = fullName.split(' ')[0];
        secondName = fullName.split(' ')[1];
      } else {
        firstName = fullName;
        secondName = '';
      }
      const queueUsers = await this.userRepository.findAll({
        where: [
          { queueUser: true },
          {
            [Op.or]: [
              {
                [Op.and]: [
                  { firstName: { [Op.like]: `%${firstName}%` } },
                  { secondName: { [Op.like]: `%${secondName}%` } },
                ],
              },
              {
                [Op.and]: [
                  { firstName: { [Op.like]: `%${secondName}%` } },
                  { secondName: { [Op.like]: `%${firstName}%` } },
                ],
              },
              {
                [Op.or]: [
                  { secondName: { [Op.like]: `%${firstName + secondName}%` } },
                  { firstName: { [Op.like]: `%${firstName + secondName}%` } },
                ],
              },
            ],
          },
        ],
        order: [
          ['startActiveTime', 'ASC'],
          ['active', 'DESC'],
          ['id', 'ASC'],
        ],
      });
      const periods: Period[] = [];
      for (let i = 0; i < queueUsers.length; i++) {
        const startDate = queueUsers[i].startActiveTime;
        const endDate = queueUsers[i].endActiveTime;
        const nextUsers: UserInPeriod[] = [];
        const userQueueItem = await this.queueRepository.findOne({
          where: { userId: queueUsers[i].id },
        });
        nextUsers.push(
          mapToUserInPeriod(queueUsers[i], userQueueItem?.swap ?? null),
        );
        while (
          i < queueUsers.length - 1 &&
          queueUsers[i + 1].startActiveTime.getTime() == startDate.getTime()
        ) {
          const userQueueItem = await this.queueRepository.findOne({
            where: { userId: queueUsers[i + 1].id },
          });
          nextUsers.push(
            mapToUserInPeriod(queueUsers[i + 1], userQueueItem?.swap ?? null),
          );
          i++;
        }
        const currentPeriod: Period = {
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          nextUsers: nextUsers,
        };
        periods.push(currentPeriod);
      }
      return periods;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async getOneNextPeriod(fullName: string = ''): Promise<Period[][]> {
    try {
      const queueUsers = await this.userRepository.findAll({
        where: { queueUser: true },
        order: [
          ['startActiveTime', 'ASC'],
          ['active', 'DESC'],
        ],
      });
      const inputData = await this.inputDataRepository.findOne();
      const periodsArray: Period[][] = [];
      const firstPeriod = await this.getCurrentQueuePeriod();
      const startDate = queueUsers[queueUsers.length - 1].startActiveTime;
      let startIndex = 0;
      if (queueUsers.length % inputData.seats == 0) {
        startDate.setMonth(startDate.getMonth() + 1);
      } else {
        startIndex = 1;
        firstPeriod[firstPeriod.length - 1].nextUsers.push(
          mapToUserInPeriod(queueUsers[0], null),
        );
      }
      periodsArray.push(firstPeriod);
      const nextPeriod: Period[] = [];
      for (let i = startIndex; i < queueUsers.length; i++) {
        const nextUsers: UserInPeriod[] = [];
        const endDate = resetDate(new Date());
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        nextUsers.push(mapToUserInPeriod(queueUsers[i], null));
        while (
          i < queueUsers.length - 1 &&
          nextUsers.length % inputData.seats != 0
        ) {
          const currentUserQueueItem = await this.queueRepository.findOne({
            where: { userId: queueUsers[i + 1].id },
          });
          nextUsers.push(
            mapToUserInPeriod(
              queueUsers[i + 1],
              currentUserQueueItem?.swap ?? null,
            ),
          );
          i++;
        }
        nextPeriod.push({
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          nextUsers: nextUsers,
        });
        startDate.setMonth(startDate.getMonth() + 1);
      }
      periodsArray.push(nextPeriod);
      periodsArray[0] = this.filterPeriods(fullName, periodsArray[0]);
      periodsArray[1] = this.filterPeriods(fullName, periodsArray[1]);
      return periodsArray;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async getUserNextPeriods(dto: CreateQueueDTO): Promise<UserPeriodDto[]> {
    try {
      const userPeriodsArray: UserPeriodDto[] = [];
      const inputData = await this.inputDataRepository.findOne();
      const queueUsers = await this.userRepository.findAll({
        where: { queueUser: true },
        order: [
          ['startActiveTime', 'ASC'],
          ['active', 'DESC'],
        ],
      });
      const currentUser = queueUsers.find((user) => user.id == dto.userId);
      if (currentUser == null) return [];
      userPeriodsArray.push({
        start_time: currentUser.startActiveTime.toISOString(),
        end_time: currentUser.endActiveTime.toISOString(),
      });
      const lastUserStartDate =
        queueUsers[queueUsers.length - 1].startActiveTime;
      let globalUsersIndex = queueUsers.length;
      if (queueUsers.length % inputData.seats == 0) {
        lastUserStartDate.setMonth(lastUserStartDate.getMonth() + 1);
      }
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < queueUsers.length; i++) {
          if (queueUsers[i].id == dto.userId) {
            const endTime = new Date(lastUserStartDate);
            endTime.setMonth(endTime.getMonth() + 1);
            endTime.setDate(endTime.getDate() - 1);
            userPeriodsArray.push({
              start_time: lastUserStartDate.toISOString(),
              end_time: endTime.toISOString(),
            });
          }
          globalUsersIndex++;
          if (globalUsersIndex % inputData.seats == 0) {
            lastUserStartDate.setMonth(lastUserStartDate.getMonth() + 1);
          }
        }
      }
      return userPeriodsArray;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async swapUsers(senderId: number, receiverId: number): Promise<boolean> {
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

  filterPeriods(fullName: string, periods) {
    try {
      let firstName: string;
      let secondName: string;
      if (fullName.includes(' ')) {
        firstName = fullName.split(' ')[0];
        secondName = fullName.split(' ')[1];
      } else {
        firstName = fullName;
        secondName = '';
      }
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

  //Функция, которая будет запускаться при старте сервера
  //и прокручивать очередь до нужного момента, если
  //была пропущена cron таска
  async adjustQueue() {
    const currentDate = resetDate(new Date());
    let queueNotInCorrectState = true;
    while (queueNotInCorrectState) {
      const activeUsersPeriod = await this.changeActiveUsers();
      const activeUsersPeriodDate = new Date(activeUsersPeriod);
      if (
        activeUsersPeriod == null ||
        activeUsersPeriodDate.getTime() >= currentDate.getTime()
      ) {
        queueNotInCorrectState = false;
      }
    }
  }

  async onModuleInit() {
    await this.adjustQueue();
  }
}
