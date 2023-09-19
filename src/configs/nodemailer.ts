import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'denistestfortp@mail.ru',
    pass: 'WT0JSmVwNKhq5W8kThFj',
  },
});

export const mailer = (message) => {
  transporter.sendMail(message, (err, info) => {
    if (err) return console.log(err);
    console.log('Email sent ', info);
  });
};
