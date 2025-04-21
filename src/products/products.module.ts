import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { WompiModule } from '../wompi/wompi.module'; // Importamos el módulo Wompi

@Module({
  imports: [WompiModule], // IMPORTANTE: Importamos el módulo que tiene WompiService
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
