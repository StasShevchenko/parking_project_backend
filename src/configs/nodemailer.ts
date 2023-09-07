import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'denistestfortp@mail.ru',
    pass: 'SsxS3rKHi7UyjrKfakia',
  },
});

export const mailer = (message) => {
  transporter.sendMail(message, (err, info) => {
    if (err) return console.log(err);
    console.log('Email sent ', info);
  });
};
