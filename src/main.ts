import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors(
    envs.cors.origin === true
      ? { origin: true }
      : envs.cors.origin
        ? { origin: envs.cors.origin }
        : undefined,
  );
  const usersService = app.get(UsersService);
  await usersService.ensureAdminExists();
  await app.listen(envs.port);
}
bootstrap();
