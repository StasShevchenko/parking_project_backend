import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
// import { getMailConfig } from 'src/configs/mail.config';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'src/modules/queue/model/queue.model';
import { QueueModule } from 'src/modules/queue/queue.module';
import { LoggerMiddleware } from 'src/utils/logger.middleware';
import { AuthModule } from '../auth/auth.module';
import { InputDataModule } from '../input-data/input-data.module';
import { InputData } from '../input-data/model/input-data.model';
import { MailModule } from '../mail/mail.module';
import { MailKeyModule } from '../mail_key/mail_key.module';
import { MailKey } from '../mail_key/model/mail_key.model';
import { Notification } from '../notifications/model/notifications.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueAhead } from '../queue-ahead/model/queue_ahead.model';
import { QueueAheadModule } from '../queue-ahead/queue-ahead.module';
import { TokenModule } from '../token/token.module';
import { User } from '../user/model/user.model';
import { UserModule } from '../user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
    }),
    ScheduleModule.forRoot(),
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: getMailConfig,
    // }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DATABASE'),
        synchronize: true,
        autoLoadModels: true,
        models: [User, Queue, InputData, QueueAhead, Notification, MailKey],
      }),
    }),
    UserModule,
    AuthModule,
    TokenModule,
    QueueModule,
    InputDataModule,
    QueueAheadModule,
    NotificationsModule,
    MailModule,
    MailKeyModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
