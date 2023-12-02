import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import {errorLogger} from './logger.config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const errorType = exception instanceof Error ? exception.name : 'Error';
        const errorMessage = exception.message || 'Unknown error';

        let statusCode = 500; // Устанавливаем статус код по умолчанию

        // Проверяем тип ошибки и устанавливаем соответствующий статус код
        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
        }

        const logData = {
            method: request.method,
            originalUrl: request.url,
            userAgent: request.get('user-agent') || '',
            ip: request.ip,
            errorMessage,
            statusCode,
            requestBody:
                request.method !== 'GET'
                    ? stringifyRequestBody(request.body)
                    : undefined,
        };

        errorLogger.error(logData);
        console.log(logData);

        if (!response.headersSent) {
            response.status(statusCode).json({
                statusCode,
                message: errorMessage,
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
