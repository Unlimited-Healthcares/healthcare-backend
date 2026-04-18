import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { BinanceService } from '../binance.service';
import { PaymentGatewayService } from '../payment-gateway.service';

@Controller('integrations/webhooks/binance')
export class BinanceWebhookController {
    private readonly logger = new Logger(BinanceWebhookController.name);

    constructor(
        private readonly binanceService: BinanceService,
        private readonly paymentGatewayService: PaymentGatewayService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() payload: any,
        @Headers('binancepay-signature') signature: string,
        @Headers('binancepay-timestamp') timestamp: string,
        @Headers('binancepay-nonce') nonce: string,
        @Headers('binancepay-certificate-sn') certificateSN: string,
    ) {
        this.logger.log('📥 Binance Webhook Received');

        // Verify Signature
        const rawBody = JSON.stringify(payload);
        const isValid = await this.binanceService.verifyWebhookSignature(rawBody, signature, timestamp, nonce, certificateSN);

        if (!isValid) {
            this.logger.warn('❌ Invalid Binance Webhook Signature');
            throw new BadRequestException('Invalid signature');
        }

        const { bizType, data } = payload;

        // Handle Pay Success
        if (bizType === 'PAY' && payload.status === 'SUCCESS') {
            const orderId = data.merchantTradeNo;
            this.logger.log(`✅ Binance Payment Success for Order: ${orderId}`);

            // Update our payment record
            await this.paymentGatewayService.handleWebhookNotification({
                gateway: 'binance',
                orderId: orderId,
                status: 'succeeded',
                rawPayload: payload
            });
        }

        return { returnCode: 'SUCCESS', returnMessage: null };
    }
}
