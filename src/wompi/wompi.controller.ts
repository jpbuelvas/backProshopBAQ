import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WompiService } from './wompi.service';
import { IntegritySignatureDTO, transactionIdDTO } from './dto/wompi.dto';
@Controller('wompi')
export class WompiController {
  constructor(private WompiService: WompiService) {}
  @Get('transaction-status')
  getTransactionStatus(@Query() transactionId: transactionIdDTO) {
    return this.WompiService.getTransactionStatus(transactionId.id);
  }

  @Post('integrity-signature')
  getIntegritySignature(@Body() IntegritySignature: IntegritySignatureDTO) {
    return this.WompiService.getIntegritySignature(
      IntegritySignature.reference,
      IntegritySignature.amountInCents,
      IntegritySignature.currency,
    );
  }
}
