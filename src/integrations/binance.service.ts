import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class BinanceService {
    private readonly logger = new Logger(BinanceService.name);
    private readonly baseUrl = 'https://bpay.binanceapi.com';
    private certificatesCache: any[] = [];
    private lastFetchTime: number = 0;
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    constructor(private configService: ConfigService) { }

    private get apiKey(): string {
        return this.configService.get<string>('BINANCE_PAY_API_KEY');
    }

    private get secretKey(): string {
        return this.configService.get<string>('BINANCE_PAY_SECRET_KEY');
    }

    // Helper to generate Binance signature
    private generateSignature(payload: string, nonce: string, timestamp: string): string {
        const signaturePayload = `${timestamp}\n${nonce}\n${payload}\n`;
        return crypto
            .createHmac('sha512', this.secretKey)
            .update(signaturePayload)
            .digest('hex')
            .toUpperCase();
    }

    async createOrder(data: {
        amount: number;
        currency: string;
        description: string;
        orderId: string;
        callbackUrl: string;
    }) {
        const endpoint = '/binancepay/openapi/v2/order';
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(16).toString('hex');

        const body = {
            env: { terminalType: 'WEB' },
            orderAmount: data.amount,
            orderCurrency: data.currency || 'USDT',
            merchantTradeNo: data.orderId,
            goods: {
                goodsType: '01',
                goodsCategory: 'Z000',
                referenceGoodsId: 'subscription_01',
                goodsName: data.description,
            },
            returnUrl: data.callbackUrl,
            cancelUrl: data.callbackUrl,
        };

        const payload = JSON.stringify(body);
        const signature = this.generateSignature(payload, nonce, timestamp);

        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'BinancePay-Timestamp': timestamp,
                    'BinancePay-Nonce': nonce,
                    'BinancePay-Certificate-SN': this.apiKey, // Using API Key as placeholder if SN not provided
                    'BinancePay-Signature': signature,
                },
            });

            if (response.data.status === 'SUCCESS') {
                return {
                    checkoutUrl: response.data.data.checkoutUrl,
                    prepayId: response.data.data.prepayId,
                };
            }
            throw new Error(`Binance Order Failed: ${response.data.errorMessage}`);
        } catch (error) {
            this.logger.error('Binance Create Order Error', error.stack);
            throw error;
        }
    }

    async getCertificates() {
        const endpoint = '/binancepay/openapi/certificates';
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(16).toString('hex');

        // Empty body for fetching certificates
        const body = {};
        const payload = JSON.stringify(body);
        const signature = this.generateSignature(payload, nonce, timestamp);

        try {
            const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'BinancePay-Timestamp': timestamp,
                    'BinancePay-Nonce': nonce,
                    'BinancePay-Certificate-SN': this.apiKey,
                    'BinancePay-Signature': signature,
                },
            });

            if (response.data.status === 'SUCCESS') {
                return response.data.data;
            }
            throw new Error(`Binance Get Certificates Failed: ${response.data.errorMessage}`);
        } catch (error) {
            this.logger.error('Binance Get Certificates Error', error.stack);
            throw error;
        }
    }

    private async refreshCertificatesIfNeeded() {
        const now = Date.now();
        if (this.certificatesCache.length === 0 || (now - this.lastFetchTime) > this.CACHE_TTL) {
            try {
                const certs = await this.getCertificates();
                if (certs && Array.isArray(certs)) {
                    this.certificatesCache = certs;
                    this.lastFetchTime = now;
                    this.logger.log(`Fetched ${certs.length} Binance public certificates`);
                }
            } catch (error) {
                this.logger.error('Failed to refresh Binance certificates', error.stack);
            }
        }
    }

    async verifyWebhookSignature(payload: string, signature: string, timestamp: string, nonce: string, certificateSN?: string): Promise<boolean> {
        // First try HMAC (older style or configured this way)
        const expectedSignature = this.generateSignature(payload, nonce, timestamp);
        if (expectedSignature === signature) return true;

        // Try RSA verification
        await this.refreshCertificatesIfNeeded();

        if (this.certificatesCache.length === 0) {
            this.logger.warn('No Binance certificates available for RSA verification');
            return false;
        }

        // Find the specific certificate by SN if provided, otherwise fallback to the first one
        const cert = certificateSN
            ? this.certificatesCache.find(c => c.certSerial === certificateSN)
            : this.certificatesCache[0];

        if (cert && cert.certPublic) {
            return this.verifyRSASignature(payload, signature, timestamp, nonce, cert.certPublic);
        }

        this.logger.warn('RSA verification failed: Certificate not found or invalid');
        return false;
    }

    verifyRSASignature(payload: string, signature: string, timestamp: string, nonce: string, publicKey: string): boolean {
        const signaturePayload = `${timestamp}\n${nonce}\n${payload}\n`;
        try {
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(signaturePayload);
            return verifier.verify(publicKey, signature, 'base64');
        } catch (error) {
            this.logger.error('RSA Verification Error', error.stack);
            return false;
        }
    }
}
