import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {AppModule} from './modules/app/app.module';
import {AllExceptionsFilter} from './utils/AllExceptionsFilter';
import * as cookieParser from 'cookie-parser';
import * as os from 'os'
import * as process from "process";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {});
    app.useGlobalFilters(new AllExceptionsFilter()); // Регистрируйте глобально AllExceptionsFilter
    app.enableCors({
        credentials: true,
        origin: true
    });
    app.use(cookieParser());

    const config = new DocumentBuilder()
        .setTitle('API')
        .setDescription('Severstal')
        .setVersion('1.0')
        .addTag('API')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
    const keys = Object.keys(os.networkInterfaces())
    const localIp = os.networkInterfaces()?.[keys[0]][1]?.address
    const env = process.env.NODE_ENV
    if (env === "development") {
        console.log(`App listen on 3000 port of ${localIp}`)
        await app.listen(3000, localIp);
    } else {
        await app.listen(3000);
    }
}

bootstrap();
