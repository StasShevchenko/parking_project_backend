import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {SequelizeModule} from '@nestjs/sequelize';
import {ScheduleModule} from '@nestjs/schedule';
import {ServeStaticModule} from '@nestjs/serve-static';
import {AvatarModule} from 'src/modules/avatar/avatar.module';
import {Queue} from 'src/modules/queue/model/queue.model';
import {QueueModule} from 'src/modules/queue/queue.module';
import {Swap} from '../swap/model/swap.model';
import {SwapModule} from '../swap/swap.module';
import {LoggerMiddleware} from 'src/utils/logger.middleware';
import {AuthModule} from '../auth/auth.module';
import {InputDataModule} from '../input-data/input-data.module';
import {InputData} from '../input-data/model/input-data.model';
import {MailModule} from '../mail/mail.module';
import {Notification} from '../notifications/model/notifications.model';
import {NotificationsModule} from '../notifications/notifications.module';
import {TokenModule} from '../token/token.module';
import {User} from '../user/model/user.model';
import {UserModule} from '../user/user.module';
import {join} from 'path';
import {Token} from "../user/model/token.model";

const ENV = process.env.NODE_ENV
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [],
            envFilePath: `.env.${ENV}`
        }),
        ServeStaticModule.forRoot({
            serveStaticOptions: {index: false},
            serveRoot: '/static',
            rootPath: join(__dirname, '..', '../../src/static/'),
        }),
        ScheduleModule.forRoot(),
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
                logging: false,
                dialectOptions: {
                    useUTC: false
                },
                models: [User, Queue, InputData, Notification, Swap, Token],
            }),
        }),
        UserModule,
        AuthModule,
        TokenModule,
        QueueModule,
        InputDataModule,
        NotificationsModule,
        MailModule,
        AvatarModule,
        SwapModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
