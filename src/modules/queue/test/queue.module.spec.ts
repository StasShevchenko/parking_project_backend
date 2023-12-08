import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../user/model/user.model';
import { Notification } from '../../notifications/model/notifications.model';
import { TokenModule } from '../../token/token.module';
import { QueueModule } from '../queue.module';
import { UserService } from '../../user/user.service';
import { AvatarService } from '../../avatar/avatar.service';
import { UserController } from '../../user/user.controller';
import { Sequelize } from 'sequelize-typescript';
import { InputData } from '../../input-data/model/input-data.model';
import { Queue } from '../model/queue.model';
import { QueueService } from '../queue.service';
import { QueueController } from '../queue.controller';
import { MailService } from '../../mail/mail.service';
import { MailKeyService } from '../../mail_key/mail_key.service';
import { InputDataService } from '../../input-data/input-data.service';
import {queueUsersTestArray} from "./utils/queueUsersTestArray";

describe('Queue module testing', () => {
  const mockMailService = {
    sendRegistrationsEmail: async () => {},
    changePassword: async () => {},
  };
  const mockMailKeyService = {};

  let queueModule: TestingModule;

  //Настройка модуля для тестирования
  beforeAll(async () => {

    //Начальная дата всегда будет январём 2024
    const mockDate = new Date("1/1/24")
    jest
        .spyOn(Date, 'now')
        .mockImplementation(() =>
            mockDate.getTime()
        );

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


});


