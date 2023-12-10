import {BadRequestException, Injectable} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectModel} from '@nestjs/sequelize';
import {Period} from 'src/interfaces/period.interface';
import {User} from '../user/model/user.model';
import {combinedLogger} from '../../utils/logger.config';
import {InputData} from '../input-data/model/input-data.model';
import {CreateQueueDTO} from './dto/create-queue.dto';
import {Queue} from './model/queue.model';
import {mapToUserInPeriod, UserInPeriod} from '../../interfaces/user.interface';

@Injectable()
export class QueueService {
    constructor(
        @InjectModel(Queue) private readonly queueRepository: typeof Queue,
        @InjectModel(InputData)
        private readonly inputDataRepository: typeof InputData,
        @InjectModel(User) private readonly userRepository: typeof User,
    ) {
    }

    async addUserToQueue(dto: CreateQueueDTO): Promise<Queue> {
        try {
            const inputData = await this.inputDataRepository.findOne();
            const queueUsers = await this.userRepository.findAll({
                    where: {in_queue: true},
                    order: [['start_active_time', 'ASC']]
                }
            );
            // Получаем юзера из бд по userId из dto
            const user = await this.userRepository.findOne({
                where: {id: dto.userId},
            });
            // Если юзер только создан и еще не в очереди
            if (!user.in_queue) {
                let isActive = false;
                if (queueUsers.length < inputData.seats) {
                    isActive = true;
                }
                let startDate = new Date();
                let endDate = new Date();
                //Если в очереди еще нет юзеров, то выставляем срок на месяц
                //от начала текущего месяца
                if (queueUsers.length == 0) {
                    endDate.setMonth(startDate.getMonth() + 1)
                    endDate.setDate(endDate.getDate() - 1)
                    let userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
                    startDate = new Date(startDate.getTime() - userTimezoneOffset)
                    endDate = new Date(endDate.getTime() - userTimezoneOffset)
                } // Если не делится на число мест, то значит в этом
                //месяце еще остались места и сроки как у последнего юзера в очереди
                else if (queueUsers.length % inputData.seats != 0) {
                    const lastUser = queueUsers[queueUsers.length - 1]
                    startDate = lastUser.start_active_time
                    endDate = lastUser.end_active_time
                } else {
                    // В этом месяце нет мест, значит сроки рассчитываем на след месяц
                    const lastUserStartDate = queueUsers[queueUsers.length - 1].start_active_time
                    startDate.setMonth(lastUserStartDate.getMonth() + 1)
                    endDate.setMonth(startDate.getMonth() + 1)
                    endDate.setDate(endDate.getDate() - 1)
                    let userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
                    startDate = new Date(startDate.getTime() - userTimezoneOffset)
                    endDate = new Date(endDate.getTime() - userTimezoneOffset)
                }

                user.in_queue = true;
                user.active = isActive;
                user.last_active_period = startDate;
                user.start_active_time = startDate;
                user.end_active_time = endDate;
                await user.save();
                return await this.queueRepository.create({
                    userId: dto.userId,
                    number: await this.getMaxNumber() + 1,
                    start_period_time: startDate,
                    end_period_time: endDate
                })
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async checkUserActivation() {
        try {
            const activeUsers = await this.userRepository.findAll({
                where: {active: true},
            });
            combinedLogger.info({Message: 'Сдвиг очереди'});
            for (const user of activeUsers) {
                await this.changeActiveUser(user);
            }
        } catch (e) {
            console.log(e);
        }
    }

    async deleteFromQueue(userId: number) {
        try {
            return await this.queueRepository.destroy({where: {userId: userId}});
        } catch (e) {
            throw new BadRequestException();
        }
    }

    async changeActiveUser(user: User) {
        try {
            const minNumberUserId = (await this.getMinNumberUser()).userId;
            const minUser = await this.userRepository.findOne({
                where: {id: minNumberUserId},
            });

            user.active = false;
            user.end_active_time = null;
            user.start_active_time = null;
            user.next_active = null;
            user.previous_active = null;
            await user.save();

            await this.deleteFromQueue(minUser.id);
            await this.addUserToQueue({userId: minUser.id});
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

    async getCurrentQueuePeriod(): Promise<Period[]> {
        try {
            const queueUsers = await this.userRepository.findAll({
                where: {in_queue: true},
                order: [['start_active_time', 'ASC'], ['active', 'DESC']]
            });
            const periods: Period[] = [];
            for (let i = 0; i < queueUsers.length; i++) {
                const startDate = queueUsers[i].start_active_time
                const endDate = queueUsers[i].end_active_time
                const nextUsers: UserInPeriod[] = []
                const userQueueItem = await this.queueRepository.findOne({where: {userId: queueUsers[i].id}})
                nextUsers.push(mapToUserInPeriod(queueUsers[i], userQueueItem.swap ?? null))
                while (i < queueUsers.length - 1 && queueUsers[i + 1].start_active_time.getTime() == startDate.getTime()) {
                    const userQueueItem = await this.queueRepository.findOne({where: {userId: queueUsers[i + 1].id}})
                    nextUsers.push(mapToUserInPeriod(queueUsers[i + 1], userQueueItem.swap ?? null))
                    i++
                }
                const currentPeriod: Period = {
                    start_time: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    nextUsers: nextUsers
                }
                periods.push(currentPeriod)
            }
            return periods;
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async getOneNextPeriod(): Promise<Period[][]> {
        try {
            const queueUsers = await this.userRepository.findAll({
                where: {in_queue: true},
                order: [['start_active_time', 'ASC'], ['active', 'DESC']]
            });
            const inputData = await this.inputDataRepository.findOne();
            const periodsArray: Period[][] = []
            const firstPeriod = await this.getCurrentQueuePeriod()
            let startDate = queueUsers[queueUsers.length - 1].start_active_time
            let startIndex = 0
            if (queueUsers.length % inputData.seats == 0) {
                startDate.setMonth(startDate.getMonth() + 1)
            } else {
                startIndex = 1
                firstPeriod[firstPeriod.length - 1].nextUsers.push(mapToUserInPeriod(queueUsers[0], null))
            }
            periodsArray.push(firstPeriod)
            const nextPeriod: Period[] = []
            for (let i = startIndex; i < queueUsers.length; i++) {
                const nextUsers: UserInPeriod[] = []
                let endDate = new Date()
                endDate.setMonth(startDate.getMonth() + 1)
                endDate.setDate(endDate.getDate() - 1)
                nextUsers.push(mapToUserInPeriod(queueUsers[i], null))
                while (i < queueUsers.length - 1 && nextUsers.length % inputData.seats != 0) {
                    const currentUserQueueItem = await this.queueRepository.findOne({where: {userId: queueUsers[i + 1].id}})
                    nextUsers.push(mapToUserInPeriod(queueUsers[i + 1], currentUserQueueItem.swap ?? null))
                    i++
                }
                nextPeriod.push({
                    start_time: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    nextUsers: nextUsers
                })
                startDate.setMonth(startDate.getMonth() + 1)
            }
            periodsArray.push(nextPeriod)
            return periodsArray
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async getUserNextPeriods(dto: CreateQueueDTO): Promise<UserPeriodDto[]> {
        try {
            const userPeriodsArray: UserPeriodDto[] = []
            const inputData = await this.inputDataRepository.findOne();
            const queueUsers = await this.userRepository.findAll({
                where: {in_queue: true},
                order: [['start_active_time', 'ASC'], ['active', 'DESC']]
            });
            const currentUser = queueUsers.find((user) => user.id == dto.userId)
            if (currentUser == null) return []
            userPeriodsArray.push({
                start_time: currentUser.start_active_time.toISOString(),
                end_time: currentUser.end_active_time.toISOString(),
            })
            let lastUserStartDate = queueUsers[queueUsers.length - 1].start_active_time
            let globalUsersIndex = queueUsers.length
            if (queueUsers.length % inputData.seats == 0) {
                lastUserStartDate.setMonth(lastUserStartDate.getMonth() + 1)
            }
            for (let j = 0; j < 4; j++) {
                for (let i = 0; i < queueUsers.length; i++) {
                    if (queueUsers[i].id == dto.userId) {
                        const endTime = new Date(lastUserStartDate)
                        endTime.setMonth(endTime.getMonth() + 1)
                        endTime.setDate(endTime.getDate() - 1)
                        userPeriodsArray.push({
                            start_time: lastUserStartDate.toISOString(),
                            end_time: endTime.toISOString()
                        })
                    }
                    globalUsersIndex++
                    if (globalUsersIndex % inputData.seats == 0) {
                        lastUserStartDate.setMonth(lastUserStartDate.getMonth() + 1)
                        if (lastUserStartDate.getMonth() == 0) {
                            lastUserStartDate.setFullYear(lastUserStartDate.getFullYear() + 1)
                        }
                    }
                }
            }
            return userPeriodsArray
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async SwapUsers(senderId: number, receiverId: number): Promise<boolean> {
        try {
            const senderInQueue: Queue = await this.queueRepository.findOne({
                where: {userId: senderId},
            });
            const receiverInQueue: Queue = await this.queueRepository.findOne({
                where: {userId: receiverId},
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

    async filterThisPeriods(firstName, secondName): Promise<Period[]> {
        try {
            const nextPeriods = await this.getCurrentQueuePeriod();
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
}

