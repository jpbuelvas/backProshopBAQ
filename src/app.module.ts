import { Module } from '@nestjs/common';
import { WompiModule } from './wompi/wompi.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    WompiModule,
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles en toda la aplicación
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
