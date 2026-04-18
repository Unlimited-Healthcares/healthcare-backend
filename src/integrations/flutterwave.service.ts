import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


export interface FlutterwavePaymentData {
    amount: number;
    currency: string;
    email: string;
    fullName: string;
    orderId: string;
    orderNumber: string;
    redirectUrl: string;
    meta?: Record<string, string>;
    subaccount?: string;
    commissionFee?: number;
}


export interface FlutterwavePaymentResponse {
    status: string;
    message: string;
    data: {
        link: string;  // Payment link to redirect user to
        tx_ref: string;
    };
}

export interface FlutterwaveVerifyResponse {
    status: string;
    message: string;
    data: {
        id: number;
        tx_ref: string;
        flw_ref: string;
        amount: number;
        currency: string;
        charged_amount: number;
        status: string; // 'successful', 'failed', 'pending'
        payment_type: string;
        customer: {
            email: string;
            name: string;
        };
        meta?: Record<string, unknown>;
    };
}

interface FlutterwavePayload {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    payment_options: string;
    customer: {
        email: string;
        name: string;
    };
    customizations: {
        title: string;
        description: string;
        logo: string;
    };
    meta: {
        orderId: string;
        orderNumber: string;
        [key: string]: string | undefined;
    };
    subaccounts?: Array<{
        id: string;
        transaction_split_ratio?: number;
        transaction_charge_type?: string;
        transaction_charge?: number;
        commission_fee?: number;
    }>;
}

export interface FlutterwaveTransferResponse {
    status: string;
    message: string;
    data: {
        id: number;
        account_number: string;
        bank_code: string;
        full_name: string;
        date_created: string;
        currency: string;
        amount: number;
        fee: number;
        status: string;
        reference: string;
        narration: string;
        complete_message: string;
        requires_approval: number;
        is_approved: number;
        bank_name: string;
    };
}

@Injectable()
export class FlutterwaveService {
    private readonly logger = new Logger(FlutterwaveService.name);
    private readonly baseUrl = 'https://api.flutterwave.com/v3';
    private secretKey: string;
    private webhookHash: string;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY', '').trim();
        this.webhookHash = this.configService.get<string>('FLUTTERWAVE_WEBHOOK_HASH', '').trim();

        if (!this.secretKey) {
            this.logger.warn('Flutterwave secret key not configured');
        }
        if (!this.webhookHash) {
            this.logger.warn('Flutterwave webhook hash not configured');
        }
    }

    /**
     * Initialize a payment - creates a payment link for the customer
     */
    async initializePayment(paymentData: FlutterwavePaymentData): Promise<FlutterwavePaymentResponse> {
        if (!this.secretKey) {
            throw new Error('Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY.');
        }

        const txRef = `FLW-${paymentData.orderId}-${Date.now()}`;

        const payload: FlutterwavePayload = {
            tx_ref: txRef,
            amount: paymentData.amount,
            currency: paymentData.currency || 'USD',
            redirect_url: paymentData.redirectUrl,
            payment_options: 'card,banktransfer,ussd',
            customer: {
                email: paymentData.email,
                name: paymentData.fullName,
            },
            customizations: {
                title: 'UnlimitedHealthCares Marketplace',
                description: `Payment for order ${paymentData.orderNumber}`,
                logo: 'https://app.unlimitedhealthcares.com/logo.png',
            },
            meta: {
                orderId: paymentData.orderId,
                orderNumber: paymentData.orderNumber,
                ...paymentData.meta,
            },
        };

        if (paymentData.subaccount) {
            payload.subaccounts = [
                {
                    id: paymentData.subaccount,
                    commission_fee: paymentData.commissionFee,
                }
            ];
        }

        try {
            const response = await fetch(`${this.baseUrl}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.status !== 'success') {
                this.logger.error(`Flutterwave init error: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Payment initialization failed');
            }

            this.logger.log(`Payment initialized: tx_ref=${txRef}, orderId=${paymentData.orderId}`);
            return {
                status: data.status,
                message: data.message,
                data: {
                    link: data.data.link,
                    tx_ref: txRef,
                },
            };
        } catch (error) {
            this.logger.error(`Flutterwave init error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Transfer funds to a bank account
     */
    async initializeTransfer(transferData: {
        account_bank: string;
        account_number: string;
        amount: number;
        currency: string;
        narration: string;
        reference: string;
        callback_url?: string;
    }): Promise<FlutterwaveTransferResponse> {
        if (!this.secretKey) {
            throw new Error('Flutterwave is not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/transfers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
                body: JSON.stringify({
                    account_bank: transferData.account_bank,
                    account_number: transferData.account_number,
                    amount: transferData.amount,
                    currency: transferData.currency || 'USD',
                    narration: transferData.narration,
                    reference: transferData.reference,
                    callback_url: transferData.callback_url,
                    debit_currency: transferData.currency || 'USD'
                }),
            });

            const data = await response.json();

            if (data.status !== 'success') {
                this.logger.error(`Flutterwave transfer error: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Transfer failed');
            }

            return data;
        } catch (error) {
            this.logger.error(`Flutterwave transfer error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify a transaction by its ID (from Flutterwave)
     */
    async verifyTransaction(transactionId: string): Promise<FlutterwaveVerifyResponse> {
        if (!this.secretKey) {
            throw new Error('Flutterwave is not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
            });

            const data = await response.json();

            if (data.status !== 'success') {
                this.logger.error(`Flutterwave verify error: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Verification failed');
            }

            return data;
        } catch (error) {
            this.logger.error(`Flutterwave verify error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify a transaction by its tx_ref
     */
    async verifyByTxRef(txRef: string): Promise<FlutterwaveVerifyResponse> {
        if (!this.secretKey) {
            throw new Error('Flutterwave is not configured');
        }

        try {
            const response = await fetch(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${txRef}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.secretKey}`,
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            this.logger.error(`Flutterwave verify by ref error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate the webhook signature from Flutterwave
     * Flutterwave uses a simple hash comparison with a secret hash you define
     */
    verifyWebhookSignature(signature: string): boolean {
        if (!this.webhookHash) {
            this.logger.warn('Flutterwave webhook hash not set, skipping verification');
            return false;
        }
        return signature === this.webhookHash;
    }

    /**
     * Check if the payment was successful
     */
    isPaymentSuccessful(verifyResponse: FlutterwaveVerifyResponse): boolean {
        return (
            verifyResponse.status === 'success' &&
            verifyResponse.data.status === 'successful'
        );
    }
}
