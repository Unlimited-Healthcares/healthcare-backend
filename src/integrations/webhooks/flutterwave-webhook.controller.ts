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
import { FlutterwaveService } from '../flutterwave.service';
import { AuditService } from '../../audit/audit.service';
import { PaymentGatewayService } from '../payment-gateway.service';
import { PaymentStatus } from '../entities/payment.entity';

@Controller('webhooks/flutterwave')
export class FlutterwaveWebhookController {
    private readonly logger = new Logger(FlutterwaveWebhookController.name);

    constructor(
        private readonly flutterwaveService: FlutterwaveService,
        private readonly auditService: AuditService,
        private readonly paymentGatewayService: PaymentGatewayService,
    ) { }

    @Post()
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('verif-hash') verifHash: string,
    ) {
        const isValid = this.flutterwaveService.verifyWebhookSignature(verifHash);
        if (!isValid) {
            this.logger.error('Invalid Flutterwave webhook signature');
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid webhook signature',
            });
        }

        const event = req.body;
        this.logger.log(`Received Flutterwave webhook: ${event.event}, tx_ref: ${event.data?.tx_ref}`);

        // Flutterwave events: charge.completed
        if (event.event === 'charge.completed' && event.data.status === 'successful') {
            const reference = event.data.tx_ref;
            const transactionId = event.data.id.toString();

            await this.paymentGatewayService.updateRelatedEntities(
                reference,
                PaymentStatus.SUCCEEDED,
                transactionId
            );
            this.logger.log(`Flutterwave payment successful for ref: ${reference}`);
        } else if (event.data?.status === 'failed') {
            const reference = event.data.tx_ref;
            await this.paymentGatewayService.updateRelatedEntities(
                reference,
                PaymentStatus.FAILED
            );
        }

        return res.status(HttpStatus.OK).json({ status: 'success' });
    }
}
