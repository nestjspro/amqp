import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';

async function bootstrap() {

    const app = await NestFactory.create(AppModule);

    //
    // Be able to detect when the app is shutdown/signaled so
    // we can clean up the amqp connections gracefully.
    //
    app.enableShutdownHooks();

    await app.listen(3000);

}

bootstrap();
