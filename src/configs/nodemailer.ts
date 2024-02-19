import * as nodemailer from 'nodemailer';
import * as process from "process";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

export const mailer = (message) => {
    transporter.sendMail(message, (err, info) => {
        if (err) return console.log(err);
        console.log('Email sent ', info);
    });
};