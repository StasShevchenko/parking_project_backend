import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { combinedLogger, errorLogger } from './logger.config'; // Импортируйте настроенный логгер

function stringifyRequestBody(body: any): string {
  try {
    // Преобразуем объект в строку JSON, рекурсивно вызывая JSON.stringify
    return JSON.stringify(body, null, 2);
  } catch (error) {
    // В случае ошибки возвращаем сообщение об ошибке
    return 'Error parsing request body';
  }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      const logData = {
        method,
        originalUrl,
        statusCode,
        contentLength,
        userAgent,
        ip,
      };

      if (method !== 'GET') {
        // Если это POST, PUT или PATCH, то логируем тело запроса
        (logData as any).requestBody = stringifyRequestBody(request.body);
      }

      if (statusCode >= 400) {
        // Если статус код ошибки, то логируем сообщение об ошибке
        errorLogger.error({
          ...logData,
        });
      } else {
        // В остальных случаях логируем информацию о запросе
        combinedLogger.info(logData);
      }
    });

    next();
  }
}
