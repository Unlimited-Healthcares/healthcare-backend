import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    Logger,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaystackService } from '../paystack.service';
import { AuditService } from '../../audit/audit.service';
import { PaymentGatewayService } from '../payment-gateway.service';
import { PaymentStatus } from '../entities/payment.entity';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
    private readonly logger = new Logger(PaystackWebhookController.name);

    constructor(
        private readonly paystackService: PaystackService,
        private readonly auditService: AuditService,
        private readonly paymentGatewayService: PaymentGatewayService,
    ) { }

    @Post()
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('x-paystack-signature') signature: string,
    ) {
        const rawBody = JSON.stringify(req.body);
        const isValid = this.paystackService.verifyWebhookSignature(signature, rawBody);

        if (!isValid) {
            this.logger.error('Invalid Paystack webhook signature');
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid webhook signature',
            });
        }

        const event = req.body;
        this.logger.log(`Received Paystack webhook: ${event.event}, reference: ${event.data?.reference}`);

        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            const transactionId = event.data.id.toString();

            await this.paymentGatewayService.updateRelatedEntities(
                reference,
                PaymentStatus.SUCCEEDED,
                transactionId
            );

            this.logger.log(`Paystack payment successful for ref: ${reference}`);
        } else if (event.event === 'charge.failed') {
            const reference = event.data.reference;
            await this.paymentGatewayService.updateRelatedEntities(
                reference,
                PaymentStatus.FAILED
            );
        }

        return res.status(HttpStatus.OK).json({ status: 'success' });
    }
}
