import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import {ProductsModule} from '../products/products.module'
@Module({
  imports: [ProductsModule],
  controllers: [IaController],
  providers: [IaService]
})
export class IaModule {}
