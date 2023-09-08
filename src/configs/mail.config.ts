// import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
// import { ConfigService } from '@nestjs/config';
// import { join } from 'path';

// export const getMailConfig = async (
//   configService: ConfigService,
// ): Promise<any> => {
//   const transport = configService.get('MAIL_TRANSPORT');
//   const mailFromName = configService.get<string>('MAIL_FROM_NAME');
//   const mailFromAddress = transport.split(':')[1].split('//')[1];

//   return {
//     transport,
//     defaults: {
//       from: `"${mailFromName}" <${mailFromAddress}>`,
//     },
//     template: {
//       dir: join(__dirname, '/../src/templates'),
//       adapter: new EjsAdapter(),
//       options: {
//         strict: false,
//       },
//     },
//   };
// };
