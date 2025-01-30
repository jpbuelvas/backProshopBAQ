import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {
  private readonly productsApi: string;
  private readonly ordersApi: string;

  constructor(private configService: ConfigService) {
    this.productsApi = this.configService.get<string>('PRODUCTS_API');
    this.ordersApi = this.configService.get<string>('ORDERS_API');
  }
  async getchProducts() {
    try {
      const response = await axios.get(this.productsApi);
      if (response.data.status === 'success') {
        const productsWithImages = response.data.data.map((product: any) => ({
          ...product,
          imagenUrl: product.imagenes[0] || 'ruta_a_imagen_placeholder.jpg',
        }));
        return productsWithImages;
      } else {
        console.error('Error al obtener productos:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error de red o de API:', error);
      return [];
    }
  }

  async registerOrderFromFrontend(pedidoData: any) {
    try {
      if (!pedidoData.transactionId || !pedidoData.productos.length) {
        throw new HttpException('Datos de pedido incompletos', HttpStatus.BAD_REQUEST);
      }
  
      console.log('Recibiendo pedido:', pedidoData);
  
      // Convertir la dirección en un solo string
      const direccionCompleta = `${pedidoData.direccion.calle}, ${pedidoData.direccion.ciudad}, ${pedidoData.direccion.estado}, ${pedidoData.direccion.codigoPostal}`;
  
      // Mapear los productos para asegurarnos de incluir precio y usar la clave correcta 'cantidad'
      const productosFormateados = pedidoData.productos.map((producto: any) => ({
        id: producto.id,
        nombre: producto.nombre,
        quantity: producto.cantidad, // Manteniendo el nombre correcto según el pedido
        tallas: producto.tallas,
        precio: producto.precio || 0, // Asegurar que haya un precio (ajusta esto si lo obtienes desde otro lado)
      }));
  
      // Crear el objeto que se enviará a Google Sheets
      const datosPedido = {
        transactionId: pedidoData.transactionId,
        nombre: pedidoData.nombre,
        telefono: pedidoData.celular, // Cambiando 'celular' a 'telefono' para coincidir con AppSheet
        direccion: direccionCompleta,
        email: pedidoData.email,
        productos: productosFormateados,
      };
  
      // Llamar al servicio de Google Sheets (AppSheet)
      const response = await fetch(this.ordersApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPedido),
      });
  
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
  
      const data = await response.text();
      if (data === 'Pedido registrado con éxito') {
        console.log('Pedido registrado correctamente en Google Sheets.');
        return { message: 'Pedido registrado con éxito' };
      } else {
        throw new Error(data || 'Error al registrar el pedido');
      }
    } catch (error) {
      console.error('Error en el registro del pedido:', error);
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error al registrar el pedido', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
