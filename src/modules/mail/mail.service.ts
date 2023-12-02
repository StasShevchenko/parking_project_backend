import { Injectable } from '@nestjs/common';
//import { mailer } from 'src/configs/nodemailer';
import { User } from '../user/model/user.model';

@Injectable()
export class MailService {
  // constructor(private readonly mailerService: MailerService) {}

  async sendRegistrationsEmail(user: User, password: string) {
    const message = {
      from: 'Команда Parking Project <denistestfortp@mail.ru>',
      to: user.email,
      subject: 'Успешная регистрация',
      html: `
                   
                    <h2> Добрый день, ${user.firstName} ${user.secondName}!</h2>
                    <h3> Вас приветствует команда <a href="https://parking-project.ru/home">Parking Project!</a></h3>
                    <p>  Вы зарегистрированы в Parking Project!<br />
                    Пароль, сгенерированный по умолчанию: <br />
                    ${password} <br />
                    Ваш логин: ${user.email} <br />
                    После авторизации на сайте вам будет предложено сменить пароль!<br />
                    Удачного дня.
                    </p>
            `,
    };

   // mailer(message);
  }

  async changePassword(key: number, user: User) {
    console.log(`---------------`);
    const message = {
      from: 'Команда Parking Project <denistestfortp@mail.ru>',
      to: user.email,
      subject: 'Восстановление пароля',
      html: `
                    <h2> Добрый день, ${user.firstName}! </h2>
                    <h3> Вы запросили сброс пароля!<br />
                   Для смены пароля введите приведенный ниже код на сайте: <br />
                    <h2>${key}</h2> <br />
                    Если вы не запрашивали смену пароля - срочно обратитесь в поддержку!<br />
                    Удачного дня.
                    </h3>
            `,
    };
    console.log(`---------------`);
   // mailer(message);
  }
}
