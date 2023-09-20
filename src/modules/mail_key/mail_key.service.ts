import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MailService } from '../mail/mail.service';
import { User } from '../user/model/user.model';
import { MailKey } from './model/mail_key.model';

@Injectable()
export class MailKeyService {
  @InjectModel(MailKey) private readonly mailKeyRepository: typeof MailKey;
  constructor(private readonly mailService: MailService) {}

  async generateMailKey(user: User) {
    try {
      const key = Math.round(Math.random() * (9999 - 1000) + 1000);
      await this.mailKeyRepository.create({
        email: user.email,
        key: key,
      });
      await this.mailService.changePassword(key, user);
    } catch (e) {
      console.log(e);
      throw new BadRequestException({ status: 401 });
    }
  }

  async KeyReview(key: number): Promise<MailKey> {
    try {
      const DBkey = await this.mailKeyRepository.findOne({
        where: { key: key },
      });
      if (DBkey) {
        return DBkey;
      }
      throw new BadRequestException('KEY EXIST');
    } catch (e) {
      throw new BadRequestException('KEY EXIST');
    }
  }

  async deleteByKey(key: number) : Promise<number> {
    return await this.mailKeyRepository.destroy({where: {key: key}})
  }
}
