import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { mailer } from 'src/configs/nodemailer';
import { User } from '../user/model/user.model';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendRegistrationsEmail(user: User) {
    const message = {
      from: 'Команда Parking Project <denistestfortp@mail.ru>',
      to: user.email,
      subject: 'Успешная регистрация',
      html: `
                    <h3> Добрый день, ${user.firstName} ${user.secondName}! </h3>
                    <p>  Вы зарегестрированы в Parking Project!<br />
                    Пароль, сгенерированны по умолчанию: <br />
                    ${user.password} <br />
                    После авторизации на сайте вам будет предложено сменить пароль!<br />
                    Удачного дня.
                    </p>
            `,
    };

    mailer(message);
    console.log(message);
  }
}
