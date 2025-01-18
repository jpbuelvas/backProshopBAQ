import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   // Configurar CORS
   app.enableCors({
    origin: 'http://localhost:3001', // Permitir este origen
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Si envías cookies o autorizaciones
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
