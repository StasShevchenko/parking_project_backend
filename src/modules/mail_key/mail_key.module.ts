import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailModule } from '../mail/mail.module';
import { MailKeyService } from './mail_key.service';
import { MailKey } from './model/mail_key.model';

@Module({
  imports: [SequelizeModule.forFeature([MailKey]), MailModule],
  providers: [MailKeyService],
  exports: [MailKeyService],
})
export class MailKeyModule {}
