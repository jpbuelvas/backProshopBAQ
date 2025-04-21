import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import {WompiService} from '../wompi/wompi.service'

@Controller('products')
export class ProductsController {
  constructor(
    private ProductsService: ProductsService,
    private WompiService: WompiService,
  ) {}
  @Get()
  getchProducts() {
    return this.ProductsService.getchProducts();
  }
  @Post('register')
  async registerOrder(@Body() pedidoData: any) {
    // Obtener datos del cliente desde Wompi
    const DataCustomer = await this.WompiService.getTransactionStatus(pedidoData.transactionId);  
    // Extraer datos del cliente desde la respuesta de Wompi
    const customerData = DataCustomer?.data?.customer_data || {};
    const merchantData = DataCustomer?.data?.merchant || {};
    // Añadir la información del cliente a pedidoData
    pedidoData.nombre = customerData.full_name || merchantData.contact_name || "No disponible";
    pedidoData.celular = customerData.phone_number || merchantData.phone_number || "No disponible";
    pedidoData.email = DataCustomer?.data?.customer_email || merchantData.email || "No disponible";
    // Enviar el pedido actualizado al servicio de base de datos
    return this.ProductsService.registerOrderFromFrontend(pedidoData);
  }

  @Get('search')
  async searchInventory(@Query('query') query: string) {
    const products = await this.getchProducts();
    // Filtra los productos que contengan el término de búsqueda en nombre o descripción
    const filtered = products.filter((p: any) => {
      const combined = `${p.nombre} ${p.descripcion} ${p.tallas}`.toLowerCase();
      return combined.includes(query.toLowerCase());
    });
    return filtered;
  }
  
}
