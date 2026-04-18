import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    RawBodyRequest,
    Logger,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AuditService } from '../../audit/audit.service';
import { PaymentGatewayService } from '../payment-gateway.service';
import { PaymentStatus } from '../entities/payment.entity';

@Controller('webhooks/stripe')
export class StripeWebhookController {
    private readonly logger = new Logger(StripeWebhookController.name);
    private stripe: Stripe | null = null;
    private webhookSecret: string;

    constructor(
        private configService: ConfigService,
        private readonly auditService: AuditService,
        private readonly paymentGatewayService: PaymentGatewayService,
    ) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');

        if (apiKey) {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
            });
        }

        if (!this.webhookSecret) {
            this.logger.warn('Stripe webhook secret not configured');
        }
    }

    @Post()
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!this.stripe || !this.webhookSecret) {
            this.logger.error('Stripe not configured. Cannot process webhook.');
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                message: 'Stripe is not configured',
            });
        }

        let event: Stripe.Event;

        try {
            const rawBody = req.rawBody;
            if (!rawBody) {
                this.logger.error('No raw body found on request');
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No raw body' });
            }

            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.webhookSecret,
            );
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: `Webhook Error: ${err.message}`,
            });
        }

        this.logger.log(`Received Stripe webhook event: ${event.type} (${event.id})`);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const reference = paymentIntent.metadata.reference;
            const transactionId = paymentIntent.id;

            if (reference) {
                await this.paymentGatewayService.updateRelatedEntities(
                    reference,
                    PaymentStatus.SUCCEEDED,
                    transactionId
                );
                this.logger.log(`Stripe payment successful for ref: ${reference}`);
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const reference = paymentIntent.metadata.reference;

            if (reference) {
                await this.paymentGatewayService.updateRelatedEntities(
                    reference,
                    PaymentStatus.FAILED
                );
            }
        }

        return res.status(HttpStatus.OK).json({ received: true });
    }
}
