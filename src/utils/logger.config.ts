import * as winston from 'winston';

const errorTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
});
const combinedTransport = new winston.transports.File({
  filename: 'logs/combined.log',
  level: 'info',
});

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      if (message.requestBody) {
        message.requestBody = message.requestBody.replace(/\n/g, ' ');
      }
      const errorMessage = ` ${message.errorMessage}`;
      return JSON.stringify(
        { timestamp, level, ...message, errorMessage },
        null,
        2,
      );
    }),
  ),
  transports: [errorTransport],
});

const combinedLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      // Заменяем символы новой строки в requestBody на пробелы
      if (message.requestBody) {
        message.requestBody = message.requestBody.replace(/\n/g, ' ');
      }
      return JSON.stringify({ timestamp, level, ...message }, null, 2);
    }),
  ),
  transports: [combinedTransport],
});

export { combinedLogger, errorLogger };
