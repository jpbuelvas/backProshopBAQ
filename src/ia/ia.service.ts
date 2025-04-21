import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ProductsService } from '../products/products.service';

@Injectable()
export class IaService {
  constructor(private readonly productsService: ProductsService) {}

  async processChat(message: string): Promise<string> {
    // 1. Obtener los productos disponibles
    const products = await this.productsService.getchProducts();

    // 2. Formatear los productos en texto para incluir en el prompt.
    // Por ejemplo, podemos crear una lista con el nombre y alguna otra propiedad.

    const productsText = products
      .map((p: any) => {
        // Si existe el arreglo de imágenes, se unen; de lo contrario, se usa imagenUrl
        const images =
          p.imagenes && p.imagenes.length > 0
            ? p.imagenes.join(', ')
            : p.imagenUrl;

        return `- ${p.nombre.trim()} | Descripción: ${p.descripcion.trim()} | Color: ${p.color.trim()} | Precio: ${p.precio} | Categoría: ${p.categoria} | Tallas: ${p.tallas.join(', ')} | Imágenes: ${images}`;
      })
      .join('\n');

    // 3. Define el system message con las instrucciones y la información del inventario.
    const systemMessage = `Eres un asistente de ventas especializado en camisetas de fútbol.
Tienes acceso a un inventario y **debes usar únicamente la información** de esa base de datos para responder a los clientes.

### Reglas:
1. **Siempre usa los datos del inventario.**
   - No inventes productos ni detalles que no aparezcan en la hoja.
   - Si el cliente menciona un equipo, temporada o jugador, busca coincidencias exactas o parciales en el nombre o descripción de los productos.
2. **Coincidencias inteligentes.**
   - Si un usuario busca “camisa del Milan”, filtra todos los productos que contengan la palabra “Milan” en su nombre o descripción.
3. **Muestra todas las opciones relevantes.**
   - Si hay más de una coincidencia, enumera cada una con su temporada, jugador, color y otros datos relevantes.
4. **Sugiere alternativas solo dentro de los productos disponibles.**
   - Si no encuentras exactamente lo que el usuario solicita, sugiere productos similares que sí estén en el inventario.
5. **No respondas sin datos válidos.**
   - Si no se encuentran coincidencias, informa que no se hallaron resultados y pide al cliente que refine su búsqueda.
   - En tallas disponibles, usa únicamente las que aparezcan en el inventario.

### Inventario de camisetas:
${productsText}

Si no se encuentran coincidencias exactas:  
🔎 *No encontré exactamente lo que buscas, pero aquí hay opciones similares que podrían interesarte:*
- {Sugerencia 1}  
- {Sugerencia 2}

Además, si el cliente pregunta por una camisa en específico que no está en el inventario, indícale que se pueden hacer encargos bajo pedido pagando el 60% del valor total, con entrega en 15-20 días hábiles.

Importante: si el usuario hace una pregunta que no tenga contexto de camisetas de fútbol, responde que no puedes darle respuesta.`;

    // 4. Construir el prompt final usando el system message y el mensaje del usuario.
    //const prompt = `${systemMessage}\n\nUsuario: ${message}\n\nAsistente:`;
    try {
      // 5. Llamar a la API de DeepSeek (o la que uses) con temperatura 0.
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions', // Endpoint corregido
        {
          messages: [
            // Cambiamos 'prompt' por 'messages'
            { role: 'system', content: systemMessage },
            { role: 'user', content: message },
          ],
          model: 'deepseek-chat', // Modelo requerido
          temperature: 0,
          response_format: {
            type: 'text',
          },
          stop: null,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json', // Header adicional recomendado
          },
          timeout: 120000, // 45 segundos
        },
      );

      // Se asume que la respuesta viene en response.data.reply
      return (
        response.data.choices[0].message.content ||
        'No se obtuvo respuesta del modelo.'
      );
    } catch (error) {
      console.error(
        'Error en llamada a LLM:',
        error.response?.data || error.message,
      );
      return 'Lo siento, hubo un error procesando tu consulta.';
    }
  }

  async extractKeywordsWithLLM(message: string): Promise<any[]> {
    const prompt = `Extrae solo las palabras clave importantes del siguiente mensaje, sin stopwords no me des respuesta como "Camisa" ya que esto al final no me ayuda a encontrar el producto, por ejemplo: "Quiero una camisa del Milan" solo me interesa Milan ya que esto
    lo podria buscar en el nombre o descripcion, Tambien si el ususario quiere una camisa talla "S"
  "${message}"
  Devuelve la respuesta en formato JSON, por ejemplo: ["Talla", "Milan"].`;

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: message },
          ],
          model: 'deepseek-chat',
          temperature: 0,
          response_format: { type: 'json_object' },
          stop: null,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 60000,
        },
      );

      // Se asume que la respuesta viene en choices[0].message.content en formato JSON.
      const keywordsData = JSON.parse(response.data.choices[0].message.content);
      const keywords: string[] = keywordsData.keywords || [];
      // Obtener productos
      return this.searchProductsByKeywords(keywords);
    } catch (error) {
      console.error(
        'Error extrayendo palabras clave:',
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async searchProductsByKeywords(keywords: string[]): Promise<any[]> {
    console.log('Buscando productos con palabras clave:', keywords);
    const products = await this.productsService.getchProducts();

    // Lista de tallas válidas
    const validSizes = [
      's',
      'm',
      'l',
      'xl',
      'xxl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
      'xs',
      'xss',
    ];
    // Buscar si alguna de las keywords es una talla válida
    const tallaKeyword = keywords.find((k) =>
      validSizes.includes(k.toLowerCase()),
    );

    const filteredProducts = products.filter((p: any) => {
      if (tallaKeyword) {
        // Se filtra usando la comparación exacta en el array de tallas
        return p.tallas.some(
          (t: string) => t.toLowerCase() === tallaKeyword.toLowerCase(),
        );
      }
      // Si no hay keyword de talla, se filtra en nombre y descripción
      const combined = `${p.nombre} ${p.descripcion}`.toLowerCase();
      return keywords.some((keyword) =>
        combined.includes(keyword.toLowerCase()),
      );
    });

    return filteredProducts;
  }
}
