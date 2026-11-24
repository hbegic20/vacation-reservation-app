import { INestApplication, ValidationPipe } from "@nestjs/common";

export function configureApp(app: INestApplication): INestApplication {
  app.enableShutdownHooks();
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  return app;
}
