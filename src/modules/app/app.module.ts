import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Queue } from 'src/modules/queue/model/queue.model';
import { QueueModule } from 'src/modules/queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { InputDataModule } from '../input-data/input-data.module';
import { InputData } from '../input-data/model/input-data.model';
import { TokenModule } from '../token/token.module';
import { User } from '../user/model/user.model';
import { UserModule } from '../user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
    }),
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
        models: [User, Queue, InputData],
      }),
    }),
    UserModule,
    AuthModule,
    TokenModule,
    QueueModule,
    InputDataModule,
  ],
})
export class AppModule {}
