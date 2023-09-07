import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailKeyService } from './mail_key.service';
import { MailKey } from './model/mail_key.model';

@Module({
  imports: [SequelizeModule.forFeature([MailKey])],
  providers: [MailKeyService],
})
export class MailKeyModule {}
