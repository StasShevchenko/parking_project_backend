import * as winston from 'winston';

// Создайте два разных транспорта для файлов
const errorTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error', // Уровень для записи только ошибок
});
const combinedTransport = new winston.transports.File({
  filename: 'logs/combined.log',
  level: 'info', // Уровень для записи всех сообщений кроме ошибок
});

const errorLogger = winston.createLogger({
  level: 'error',
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

// ...

export { combinedLogger, errorLogger };
