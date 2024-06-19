import * as nodemailer from 'nodemailer';
import * as process from "process";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "ShStas21@gmail.com",
        pass: "omnqxscqypetrkbf",
    },
});

export const mailer = (message) => {
    transporter.sendMail(message, (err, info) => {
        if (err) return console.log(err);
        console.log('Email sent ', info);
    });
};