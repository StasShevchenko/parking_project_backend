import {Test, TestingModule} from '@nestjs/testing';
import {ConfigModule} from '@nestjs/config';
import {getModelToken, SequelizeModule} from '@nestjs/sequelize';
import {User} from '../../user/model/user.model';
import {Notification} from '../../notifications/model/notifications.model';
import {TokenModule} from '../../token/token.module';
import {QueueModule} from '../queue.module';
import {UserService} from '../../user/user.service';
import {AvatarService} from '../../avatar/avatar.service';
import {UserController} from '../../user/user.controller';
import {Sequelize} from 'sequelize-typescript';
import {InputData} from '../../input-data/model/input-data.model';
import {Queue} from '../model/queue.model';
import {QueueService} from '../queue.service';
import {QueueController} from '../queue.controller';
import {MailService} from '../../mail/mail.service';
import {MailKeyService} from '../../mail_key/mail_key.service';
import {InputDataService} from '../../input-data/input-data.service';
import {
  evenQueueUsersTestArray,
  extendedEvenQueueUsersTestArray, extendedOddQueueUsersTestArray,
  oddQueueUsersTestArray
} from "./utils/queueUsersTestArray";

describe('Queue module testing', () => {
  const mockMailService = {
    sendRegistrationsEmail: async () => {},
    changePassword: async () => {},
  };
  const mockMailKeyService = {};

  let queueModule: TestingModule;

  //Настройка модуля для тестирования
  beforeAll(async () => {

    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0));

    queueModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          logging: false,
          autoLoadModels: true,
          synchronize: true,
          models: [User, Notification, InputData, Queue],
        }),
        SequelizeModule.forFeature([User, Queue, InputData]),
        TokenModule,
        QueueModule,
      ],
      providers: [
        UserService,
        AvatarService,
        QueueService,
        MailService,
        MailKeyService,
        InputDataService,
      ],
      controllers: [UserController, QueueController],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(MailKeyService)
      .useValue(mockMailKeyService)
      .compile();
  });

  beforeEach(async () => {
    //Создаем конфиг очереди перед каждым тестом
    const inputDataService = queueModule.get(InputDataService);
    await inputDataService.create({
      seats: 3,
      period: 30,
      numberOfOutputPeriods: 4,
    });
  });

  //Очищаем бд после каждого теста
  afterEach(async () => {
    const db = queueModule.get(Sequelize);
    await db.truncate();
  });

  //Проверка функционала добавления в очередь
  it('Should return one user when we add it via auth with in_queue=true', async () => {
    const userService = queueModule.get(UserService);
    await userService.createUser({
      firstName: 'Egorka',
      secondName: 'Goremikov',
      email: 'egorka@mail.ru',
      in_queue: true,
    });
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getCurrentPeriod({
      fullName: '',
    });
    const usersCount = finalResult[0].nextUsers.length;
    expect(usersCount).toBe(1);
  });

  //Число пользователей делится на цело на число мест (3 места 6 юзеров)
  it('Should return periods array of two length for six users', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getCurrentPeriod({
      fullName: '',
    });
    const periodsCount = finalResult.length
    expect(periodsCount).toBe(2)
  })

  it('Should return filtered periods array of 1 length for six users', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getCurrentPeriod({
      fullName: 'Maxim6',
    });
    const periodsCount = finalResult.length
    expect(periodsCount).toBe(1)
  })

  //Число пользователей делится на цело на число мест (3 места 6 юзеров)
  it('Should return periods array of fourth length for six users', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getNextPeriod({
      fullName: '',
    });
    const periodsCount = finalResult[0].length + finalResult[1].length
    expect(periodsCount).toBe(4)
  })

  //Число пользователей делится на цело на число мест (3 места 6 юзеров)
  it('Should return only one user in each of two periods', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getNextPeriod({
      fullName: 'Maxim6',
    });
    const periodsCount = finalResult[0][0].nextUsers.length + finalResult[1][0].nextUsers.length
    expect(periodsCount).toBe(2)
  })

  //Число пользователей делится на цело на число мест (3 места, 6 юзеров)
  //Проверка номера месяца для последнего пользователя во втором периоде
  //Должно вернуть 4 месяц (апрель)
  it('Should return 4 month number for last user in next period', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getNextPeriod({
      fullName: '',
    });
    const monthNumber = new Date(finalResult[1][1].start_time).getMonth() + 1
    expect(monthNumber).toBe(4)
  })

  //Число пользователей НЕ делится на цело на число мест (3 места, 5 юзеров)
  //Проверка почты последнего пользователя во втором периоде
  //Должно вернуть bc@mail.ru
  it('Should return concrete email for last user in second period', async () => {
    const userService = queueModule.get(UserService);
    for (const user of oddQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getNextPeriod({
      fullName: '',
    });
    const email = finalResult[1][1].nextUsers[0].email
    expect(email).toEqual('bc@mail.ru')
  })

  //Число пользователей НЕ делится на целое на число мест (3 места, 5 юзеров)
  //Проверяем что четвертый будущий срок для Egorka1 - начинается в июне
  it('Should return 5 as start time of fourth next period for Egorka1', async () => {
    const userRepository = queueModule.get(getModelToken(User))
    const userService = queueModule.get(UserService);
    for (const user of oddQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const userId = (await userRepository.findOne({where: {email: 'egorka@mail.ru'}})).id
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getUserNextPeriods({
      userId: userId
    })
    const monthNumber = new Date(finalResult[3].start_time).getMonth() + 1
    expect(monthNumber).toEqual(6)
  })

  //Число пользователей делится на целое число мест (3 места, 6 юзеров)
  //Проверяем что четвертый будущий срок для Egorka1 - начинается в июле
  it('Should return 6 as start time of fourth next period for Egorka1', async () => {
    const userRepository = queueModule.get(getModelToken(User))
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const userId = (await userRepository.findOne({where: {email: 'egorka@mail.ru'}})).id
    const queueController = queueModule.get(QueueController);
    const finalResult = await queueController.getUserNextPeriods({
      userId: userId
    })
    console.log(finalResult)
    const monthNumber = new Date(finalResult[3].start_time).getMonth() + 1
    expect(monthNumber).toEqual(7)
  })

  //Тестируем функцию сдвига очереди (число юзеров 6, мест 3)
  test('Should move queue after one month (even users number)', async() => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 1))
    await queueService.changeActiveUsers()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    const finalResult = periods[0].nextUsers[0].email
    jest.setSystemTime(new Date(2024, 0))
    expect(finalResult).toEqual('gery@mail.ru')
  })

  //Тестируем функцию сдвига очереди (число юзеров 5, мест 3)
  test('Should move queue after one month (odd users number)', async () => {
    const userService = queueModule.get(UserService);
    for (const user of oddQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 1))
    await queueService.changeActiveUsers()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    const finalResult = periods[0].nextUsers[2].email
    jest.setSystemTime(new Date(2024, 0))
    expect(finalResult).toEqual('bc@mail.ru')
  })

  //Тестируем функцию сдвига очереди (число юзеров 9, мест 3)
  test('Should move queue after one month (extended users number)', async () => {
    const userService = queueModule.get(UserService);
    for (const user of extendedEvenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 1))
    await queueService.changeActiveUsers()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    const finalResult = periods[1].nextUsers[0].email
    jest.setSystemTime(new Date(2024, 0))
    expect(finalResult).toEqual('ex@mail.ru')
  })


  //Тестируем функцию сдвига очереди (число юзеров 8, мест 3)
  test('Should move queue after one month (extended odd users number)', async () => {
    const userService = queueModule.get(UserService);
    for (const user of extendedOddQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 1))
    await queueService.changeActiveUsers()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    const finalResult = periods[1].nextUsers[0].email
    jest.setSystemTime(new Date(2024, 0))
    expect(finalResult).toEqual('egorka@mail.ru')
  })

  //Тестируем функцию сдвига очереди (moduleInit функция)
  //Если мы 2 месяца не двигали очередь, то функция должна сдвинуть ее
  //к марту
  test('Should correctly adjust queue to appropriate state', async () => {
    const userService = queueModule.get(UserService);
    for (const user of evenQueueUsersTestArray) {
      await userService.createUser(user)
    }
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 2))
    await queueService.adjustQueue()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    const dateString = periods[0].start_time
    const date = new Date(dateString)
    jest.setSystemTime(new Date(2024, 0))
    expect(date.getMonth()).toBe(2)
  })

  //Тестируем функцию сдвига очереди при пустых юзерах(moduleInit функция)
  test('Should do nothing', async () => {
    const queueController = queueModule.get(QueueController);
    const queueService = queueModule.get(QueueService)
    jest.setSystemTime(new Date(2024, 2))
    await queueService.adjustQueue()
    const periods = await queueController.getCurrentPeriod({
      fullName: ""
    })
    jest.setSystemTime(new Date(2024, 0))
    expect(periods).toEqual([])
  })

});


