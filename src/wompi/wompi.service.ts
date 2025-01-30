import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export  class WompiService {
  private readonly integritySecret: string;
  private readonly privateKey: string;

  constructor(private configService: ConfigService) {
    this.integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');
  }

  getIntegritySignature(reference: string, amountInCents: number, currency: string) {
    const signatureString = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    console.log(signatureString, 'signatureString');
    const integritySignature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');
    console.log(integritySignature, 'integritySignature');
    return integritySignature;
  }

  async getTransactionStatus(transactionId: string) {
    try {
      const response = await axios.get(
        `https://sandbox.wompi.co/v1/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.privateKey}` },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction status:', error.message);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = error.response?.data?.error?.message || 'Unexpected error';
        throw new HttpException(
          {
            statusCode: status,
            message: `Failed to fetch transaction status: ${message}`,
            details: error.response?.data || null,
          },
          status,
        );
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred while fetching the transaction status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
