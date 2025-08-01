import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

dotenv.config();

async function bootstrap() {

  const port = 3003;
  //initializeApp();
  console.log('🔍 Environment Variables Debug:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('DB_HOST:', process.env.DB_HOST || 'undefined (fallback: localhost)');
  console.log('DB_PORT:', process.env.DB_PORT || 'undefined (fallback: 5433)');
  console.log('DB_USER:', process.env.DB_USER || 'undefined (fallback: postgres)');
  console.log('DB_NAME:', process.env.DB_NAME || 'undefined (fallback: kondo)');
  console.log('DB_DIALECT:', process.env.DB_DIALECT || 'undefined (fallback: postgres)');
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
  .setTitle('Kondomino API')
  .setDescription(`The best API in the world. JSON download: http://localhost:${port}/api-json`)
  .setVersion('1.0')
  .setBasePath('v1')
  .setExternalDoc('Postman Collection', '/api-json')
  .addTag('kondos-1.0')
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(port);
}
bootstrap();
