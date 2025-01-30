import { Module } from '@nestjs/common';
import { WompiModule } from './wompi/wompi.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    WompiModule,
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles en toda la aplicación
    }),
    ProductsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class AppModule {}
