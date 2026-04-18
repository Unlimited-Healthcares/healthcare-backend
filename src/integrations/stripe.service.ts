
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (apiKey) {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2023-10-16' as any,
            });
        } else {
            this.logger.warn('Stripe API key not configured');
        }
    }

    async createPaymentIntent(amount: number, currency: string = 'usd', metadata: Record<string, string> = {}) {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // amount in cents
                currency,
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
            };
        } catch (error) {
            this.logger.error(`Error creating payment intent: ${error.message}`);
            throw error;
        }
    }

    async verifyPayment(paymentIntentId: string) {
        if (!this.stripe) {
            throw new Error('Stripe is not configured');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent.status === 'succeeded';
        } catch (error) {
            this.logger.error(`Error verifying payment: ${error.message}`);
            throw error;
        }
    }
}
