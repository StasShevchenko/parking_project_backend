import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { errorLogger } from './logger.config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const errorType = exception instanceof Error ? exception.name : 'Error';
    const errorMessage = exception.message || 'Unknown error';

    // Если уже была обработка ошибки, не логируем ее снова
    if (response.headersSent) {
      return;
    }

    const logData = {
      method: request.method,
      originalUrl: request.url,
      userAgent: request.get('user-agent') || '',
      ip: request.ip,
      errorType,
      errorMessage,
      requestBody:
        request.method !== 'GET'
          ? stringifyRequestBody(request.body)
          : undefined,
    };

    errorLogger.error(logData);

    if (!response.headersSent) {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}

export function stringifyRequestBody(body: any): string {
  try {
    return JSON.stringify(body, null, 2);
  } catch (error) {
    return 'Error parsing request body';
  }
}
