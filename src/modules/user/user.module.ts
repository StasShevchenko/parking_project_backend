import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailModule } from '../mail/mail.module';
import { QueueModule } from '../queue/queue.module';
import { TokenModule } from '../token/token.module';
import { User } from './model/user.model';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AvatarService } from '../avatar/avatar.service';
import {KeyService} from "./key.service";

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    TokenModule,
    MailModule,
    QueueModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtService, AvatarService, KeyService],
  exports: [UserService],
})
export class UserModule {}
