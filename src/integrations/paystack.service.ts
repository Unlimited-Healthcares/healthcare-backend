import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaystackPaymentData {
    amount: number;
    currency?: string;
    email: string;
    callbackUrl: string;
    metadata?: Record<string, unknown>;
    reference?: string;
    subaccount?: string;
    transactionCharge?: number; // in kobo
}


export interface PaystackPaymentResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string; // 'success', 'abandoned', 'failed'
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: Record<string, unknown>;
        customer: {
            id: number;
            first_name: string | null;
            last_name: string | null;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: unknown;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
            account_name: string | null;
        };
    };
}

@Injectable()
export class PaystackService {
    private readonly logger = new Logger(PaystackService.name);
    private readonly baseUrl = 'https://api.paystack.co';
    private secretKey: string;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY', '').trim();

        if (!this.secretKey) {
            this.logger.warn('Paystack secret key not configured');
        }
    }

    /**
     * Initialize a transaction
     */
    async initializeTransaction(paymentData: PaystackPaymentData): Promise<PaystackPaymentResponse> {
        if (!this.secretKey) {
            throw new Error('Paystack is not configured. Set PAYSTACK_SECRET_KEY.');
        }

        const payload = {
            email: paymentData.email,
            amount: Math.round(paymentData.amount * 100), // convert to kobo/cents
            currency: paymentData.currency || 'USD',
            callback_url: paymentData.callbackUrl,
            reference: paymentData.reference || `PS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            metadata: paymentData.metadata,
            subaccount: paymentData.subaccount,
            transaction_charge: paymentData.transactionCharge,
        };


        try {
            const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!data.status) {
                this.logger.error(`Paystack init error: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Payment initialization failed');
            }

            this.logger.log(`Paystack payment initialized: reference=${payload.reference}`);
            return data;
        } catch (error) {
            this.logger.error(`Paystack init error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify a transaction
     */
    async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
        if (!this.secretKey) {
            throw new Error('Paystack is not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
            });

            const data = await response.json();

            if (!data.status) {
                this.logger.error(`Paystack verify error: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Verification failed');
            }

            return data;
        } catch (error) {
            this.logger.error(`Paystack verify error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(signature: string, payload: string): boolean {
        const hash = crypto.createHmac('sha512', this.secretKey).update(payload).digest('hex');
        return hash === signature;
    }

    /**
     * Is transaction successful
     */
    isPaymentSuccessful(verifyResponse: PaystackVerifyResponse): boolean {
        return (
            verifyResponse.status &&
            verifyResponse.data.status === 'success'
        );
    }
}
