import { Injectable } from '@nestjs/common';
import { mailer } from 'src/configs/nodemailer';
import { User } from '../user/model/user.model';

@Injectable()
export class MailService {
  // constructor(private readonly mailerService: MailerService) {}

  async sendRegistrationsEmail(user: User, password: string) {
    console.log(password)
    const message = {
      from: 'Команда Parking Project <denistestfortp@mail.ru>',
      to: user.email,
      subject: 'Успешная регистрация',
      html: `
                    <h3> Добрый день, ${user.firstName} ${user.secondName}! </h3>
                    <p>  Вы зарегистрированы в Parking Project!<br />
                    Пароль, сгенерированный по умолчанию: <br />
                    ${password} <br />
                    После авторизации на сайте вам будет предложено сменить пароль!<br />
                    Удачного дня.
                    </p>
            `,
    };

    mailer(message);
    console.log(message);
  }
}
