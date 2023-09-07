import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MailKey } from './model/mail_key.model';

@Injectable()
export class MailKeyService {
  @InjectModel(MailKey) private readonly mailKeyRepository: typeof MailKey;

  async generateMailKey(email: string) {
    const key = Math.random() * (9999 - 1000) + 1000;
    await this.mailKeyRepository.create({
      email: email,
      key: key,
    });
  }

  async KeyReview(key: number) {}
}
