import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.setup';
import { runAllSeeds } from './seeds/all.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  const clientUrl = configService.get<string>('CLIENT_URL', 'http://localhost:5173');

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (server-to-server, mobile app, postman, curl)
      if (!origin) return callback(null, true);

      // Cho phép Vercel (.vercel.app), localhost, Render và CLIENT_URL
      if (
        origin === clientUrl ||
        origin.includes('vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('onrender.com') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      // Luôn cho phép để đảm bảo không bị chặn nhầm các sub-domain hoặc preview links
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-cache-bypass',
      'x-no-cache',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
  });

  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  // Tự động kiểm tra và seed dữ liệu khởi tạo nếu thiếu
  try {
    const dataSource = app.get(DataSource);
    const autoSeedLogger = new Logger('AutoSeed');
    await runAllSeeds(dataSource, autoSeedLogger);
  } catch (seedErr) {
    console.error('Lưu ý auto-seed khởi tạo:', seedErr);
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger Documentation is available at: http://localhost:${port}/docs`);
}
bootstrap();
