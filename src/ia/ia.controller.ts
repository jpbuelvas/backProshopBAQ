import { Controller,Post,Body } from '@nestjs/common';
import { IaService } from './ia.service';

@Controller('ia')
export class IaController {
    constructor(private readonly aiService: IaService) {}

  @Post('chat')
  async chat(@Body('message') message: string) {
    const reply = await this.aiService.processChat(message);
    return { reply };
  }

  @Post('extract')
  async extractKeywords(@Body('message') message: string) {
    const keywords = await this.aiService.extractKeywordsWithLLM(message);
    return { keywords };
  }
}
