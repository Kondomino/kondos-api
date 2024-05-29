import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initializeApp } from "firebase-admin/app";
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {

  initializeApp();

  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3003);}
bootstrap();
