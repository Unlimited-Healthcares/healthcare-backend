import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction, WalletTransactionType, WalletTransactionStatus } from './entities/wallet-transaction.entity';
import { User } from '../users/entities/user.entity';
import { PaymentGatewayService } from '../integrations/payment-gateway.service';
import { PaystackService } from '../integrations/paystack.service';
import { FlutterwaveService } from '../integrations/flutterwave.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletsService {
    private readonly logger = new Logger(WalletsService.name);
    private readonly PLATFORM_COMMISSION_RATE = 0.15; // 15%

    // Fallback static rates for common currencies (USD base)
    private readonly FALLBACK_RATES = {
        'USD': 1,
        'NGN': 1600,
        'GHS': 13.5,
        'KES': 130,
        'ZAR': 19,
        'GBP': 0.79,
        'EUR': 0.92,
    };

    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
        @InjectRepository(WalletTransaction)
        private readonly transactionRepo: Repository<WalletTransaction>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly paymentGatewayService: PaymentGatewayService,
        private readonly paystackService: PaystackService,
        private readonly flutterwaveService: FlutterwaveService,
        private readonly notificationsService: NotificationsService,
        private readonly dataSource: DataSource,
    ) { }

    async getOrCreateWallet(userId: string): Promise<Wallet> {
        let wallet = await this.walletRepo.findOne({ where: { userId } });
        if (!wallet) {
            wallet = this.walletRepo.create({
                userId,
                balance: 0,
                onboardingComplete: false,
                isActivated: false
            });
            await this.walletRepo.save(wallet);
        }
        return wallet;
    }

    async getActivationFee(userId: string): Promise<number> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Providers ($10), others ($5)
        const isProvider = (user.roles || []).some(role => ['doctor', 'center', 'staff'].includes(role));
        return isProvider ? 10 : 5;
    }

    async initializeActivationPayment(userId: string, email: string, redirectUrl: string, paymentMethod: string = 'paystack') {
        const fee = await this.getActivationFee(userId);
        const wallet = await this.getOrCreateWallet(userId);
        const prefix = paymentMethod === 'paystack' ? 'PS' : 'FW';
        const reference = `ACT-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const gatewayAmount = fee;
        const gatewayCurrency = 'USD';

        // Create pending activation transaction
        const transaction = this.transactionRepo.create({
            walletId: wallet.id,
            amount: fee,
            type: WalletTransactionType.ACTIVATION,
            status: WalletTransactionStatus.PENDING,
            reference,
            description: `Account Activation Fee (${fee} USD via ${paymentMethod})`,
        });
        await this.transactionRepo.save(transaction);

        const result = await this.paymentGatewayService.processPayment({
            amount: gatewayAmount,
            currency: gatewayCurrency,
            patientId: userId,
            centerId: 'platform',
            description: 'Account Activation',
            paymentMethod,
            metadata: {
                userId,
                walletId: wallet.id,
                type: 'account_activation',
                fee: fee,
                email,
                callbackUrl: redirectUrl,
                redirectUrl: redirectUrl,
                reference
            }
        });

        return {
            data: {
                authorization_url: result.redirectUrl,
                reference: result.id,
                access_code: result.transactionId
            }
        };
    }

    async completeOnboarding(userId: string, minimumAmount: number, currency?: string) {
        return await this.updateSettings(userId, { minimumAmount, currency, onboardingComplete: true });
    }

    async updateSettings(userId: string, data: {
        minimumAmount?: number,
        currency?: string,
        onboardingComplete?: boolean,
        isAutoTopUpEnabled?: boolean,
        rechargeThreshold?: number,
        rechargeAmount?: number,
        monthlySpendMax?: number
    }) {
        const wallet = await this.getOrCreateWallet(userId);
        if (data.minimumAmount !== undefined) wallet.minimumTopUpAmount = data.minimumAmount;
        if (data.currency) wallet.currency = data.currency;
        if (data.onboardingComplete !== undefined) wallet.onboardingComplete = data.onboardingComplete;
        if (data.isAutoTopUpEnabled !== undefined) wallet.isAutoTopUpEnabled = data.isAutoTopUpEnabled;
        if (data.rechargeThreshold !== undefined) wallet.rechargeThreshold = data.rechargeThreshold;
        if (data.rechargeAmount !== undefined) wallet.rechargeAmount = data.rechargeAmount;
        if (data.monthlySpendMax !== undefined) wallet.monthlySpendMax = data.monthlySpendMax;

        return await this.walletRepo.save(wallet);
    }

    async getWalletBalance(userId: string) {
        const wallet = await this.getOrCreateWallet(userId);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        return {
            balance: wallet.balance,
            currency: wallet.currency,
            onboardingComplete: wallet.onboardingComplete,
            isActivated: wallet.isActivated,
            minimumTopUpAmount: wallet.minimumTopUpAmount,
            isAutoTopUpEnabled: wallet.isAutoTopUpEnabled,
            rechargeThreshold: wallet.rechargeThreshold,
            rechargeAmount: wallet.rechargeAmount,
            monthlySpendMax: wallet.monthlySpendMax,
            userRoles: user?.roles || []
        };
    }

    /**
     * Get real-time exchange rate (falls back to static if API fails)
     */
    async getExchangeRate(base: string = 'USD'): Promise<Record<string, number>> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base.toUpperCase()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API failed');
            const data = await response.json();
            return data.rates || this.FALLBACK_RATES;
        } catch (error) {
            this.logger.warn(`Could not fetch live rates for ${base}, using fallbacks: ${error.message}`);
            return this.FALLBACK_RATES;
        }
    }

    /**
     * Initialize a wallet deposit via Paystack
     */
    async initializeDeposit(userId: string, amount: number, email: string, redirectUrl: string, paymentMethod: string = 'paystack') {
        const wallet = await this.getOrCreateWallet(userId);
        const prefix = paymentMethod === 'paystack' ? 'PS' : 'FW';
        const reference = `WAL-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const gatewayAmount = amount;
        const gatewayCurrency = 'USD';

        // Create pending transaction record
        const transaction = this.transactionRepo.create({
            walletId: wallet.id,
            amount,
            type: WalletTransactionType.DEPOSIT,
            status: WalletTransactionStatus.PENDING,
            reference,
            description: `Wallet funding of ${amount} USD (via ${paymentMethod})`,
        });
        await this.transactionRepo.save(transaction);

        const result = await this.paymentGatewayService.processPayment({
            amount: gatewayAmount,
            currency: gatewayCurrency,
            patientId: userId,
            centerId: 'platform',
            description: 'Wallet Funding',
            paymentMethod,
            metadata: {
                userId,
                walletId: wallet.id,
                type: 'wallet_funding',
                originalAmount: amount,
                originalCurrency: wallet.currency,
                appliedRate: gatewayAmount / amount,
                email,
                callbackUrl: redirectUrl,
                redirectUrl: redirectUrl,
                reference
            }
        });

        return {
            data: {
                authorization_url: result.redirectUrl,
                reference: result.id,
                access_code: result.transactionId
            }
        };
    }

    /**
     * Process a successful deposit (usually called by Webhook)
     */
    async processDeposit(reference: string) {
        const transaction = await this.transactionRepo.findOne({
            where: { reference },
            relations: ['wallet']
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.status === WalletTransactionStatus.SUCCESS) {
            return transaction;
        }

        let isSuccess = false;

        if (reference.includes('-PS-')) {
            const verification = await this.paystackService.verifyTransaction(reference);
            isSuccess = this.paystackService.isPaymentSuccessful(verification);
        } else if (reference.includes('-FW-')) {
            // For Flutterwave, checking by reference
            const verification = await this.flutterwaveService.verifyByTxRef(reference);
            isSuccess = this.flutterwaveService.isPaymentSuccessful(verification);
        } else {
            // Fallback to Paystack for legacy references
            const verification = await this.paystackService.verifyTransaction(reference);
            isSuccess = this.paystackService.isPaymentSuccessful(verification);
        }

        if (isSuccess) {
            return await this.dataSource.transaction(async (manager) => {
                // Update transaction status
                transaction.status = WalletTransactionStatus.SUCCESS;
                await manager.save(transaction);

                const wallet = transaction.wallet;

                // Handle Activation Type
                if (transaction.type === WalletTransactionType.ACTIVATION) {
                    wallet.isActivated = true;
                    await manager.save(wallet);
                    this.logger.log(`Account Activation successful for User ${wallet.userId}`);

                    await this.notificationsService.createNotification({
                        userId: wallet.userId,
                        type: 'payment',
                        title: 'Wallet Activated',
                        message: `Your wallet has been successfully activated and is ready for use.`,
                        data: { walletId: wallet.id }
                    });

                    return transaction;
                }

                // Normal Deposit: Update wallet balance
                wallet.balance = Number(wallet.balance) + Number(transaction.amount);
                await manager.save(wallet);

                this.logger.log(`Wallet ${wallet.id} funded with ${transaction.amount} ${wallet.currency}`);

                await this.notificationsService.createNotification({
                    userId: wallet.userId,
                    type: 'payment',
                    title: 'Wallet Funded Successfully',
                    message: `You have successfully added ${transaction.amount} ${wallet.currency} to your wallet.`,
                    data: { walletId: wallet.id, amount: transaction.amount, currency: wallet.currency }
                });

                return transaction;
            });
        } else {
            transaction.status = WalletTransactionStatus.FAILED;
            await this.transactionRepo.save(transaction);
            throw new BadRequestException('Payment was not successful');
        }
    }

    /**
     * Handle Paystack Webhook events
     */
    async handlePaystackWebhook(payload: Record<string, unknown>, signature: string) {
        interface PaystackPayload {
            event: string;
            data: {
                reference: string;
            };
        }
        const typedPayload = payload as unknown as PaystackPayload;
        // Verify signature
        if (!this.paystackService.verifyWebhookSignature(signature, JSON.stringify(payload))) {
            throw new BadRequestException('Invalid signature');
        }

        const event = typedPayload.event;
        const data = typedPayload.data;
        const reference = data?.reference;

        this.logger.log(`Handling Paystack webhook: ${event} for ref ${reference}`);

        if (event === 'charge.success' && reference) {
            await this.processDeposit(reference);
        } else if (event === 'charge.failed' && reference) {
            const transaction = await this.transactionRepo.findOne({ where: { reference } });
            if (transaction && transaction.status === WalletTransactionStatus.PENDING) {
                transaction.status = WalletTransactionStatus.FAILED;
                await this.transactionRepo.save(transaction);
            }
        }

        return { status: true };
    }

    /**
     * Handle Flutterwave Webhook events
     */
    async handleFlutterwaveWebhook(payload: Record<string, unknown>, signature: string) {
        interface FlutterwavePayload {
            event: string;
            data: {
                tx_ref: string;
                status: string;
            };
        }
        const typedPayload = payload as unknown as FlutterwavePayload;
        // Verify signature
        if (!this.flutterwaveService.verifyWebhookSignature(signature)) {
            throw new BadRequestException('Invalid signature');
        }

        const event = typedPayload.event;
        const data = typedPayload.data;
        const reference = data?.tx_ref;

        this.logger.log(`Handling Flutterwave webhook: ${event} for ref ${reference}`);

        if (data?.status === 'successful' && reference) {
            await this.processDeposit(reference);
        } else if (data?.status === 'failed' && reference) {
            const transaction = await this.transactionRepo.findOne({ where: { reference } });
            if (transaction && transaction.status === WalletTransactionStatus.PENDING) {
                transaction.status = WalletTransactionStatus.FAILED;
                await this.transactionRepo.save(transaction);
            }
        }

        return { status: true };
    }

    /**
     * Main logic for processing a service payment with 15% commission
     */
    async processServicePayment(
        requesterId: string,
        providerId: string,
        amount: number,
        description: string,
        orderId?: string
    ) {
        const requesterWallet = await this.getOrCreateWallet(requesterId);
        const providerWallet = await this.getOrCreateWallet(providerId);

        // Platform takes 15% from both parties
        const commissionAmount = amount * this.PLATFORM_COMMISSION_RATE;
        const totalDeductionFromRequester = Number(amount) + Number(commissionAmount);

        // Requirement: Service requester (Patient) must have enough for the service fee + commission
        if (requesterWallet.balance < totalDeductionFromRequester) {
            throw new BadRequestException(`Insufficient wallet balance. Total required: ${totalDeductionFromRequester} (Fee: ${amount} + 15% platform charge: ${commissionAmount}). Please top up.`);
        }

        return await this.dataSource.transaction(async (manager) => {
            // 1. Deduct total from requester (Patient)
            requesterWallet.balance = Number(requesterWallet.balance) - Number(totalDeductionFromRequester);
            await manager.save(requesterWallet);

            const requesterTx = this.transactionRepo.create({
                walletId: requesterWallet.id,
                amount: -totalDeductionFromRequester,
                type: WalletTransactionType.SERVICE_PAYMENT,
                status: WalletTransactionStatus.SUCCESS,
                description: `Payment for service: ${description} (Includes 15% service charge)`,
                reference: orderId
            });
            await manager.save(requesterTx);

            // 2. Credit FULL amount to provider
            providerWallet.balance = Number(providerWallet.balance) + Number(amount);
            await manager.save(providerWallet);

            const providerCreditTx = this.transactionRepo.create({
                walletId: providerWallet.id,
                amount: amount,
                type: WalletTransactionType.SERVICE_PAYMENT,
                status: WalletTransactionStatus.SUCCESS,
                description: `Received payment for: ${description}`,
                reference: orderId
            });
            await manager.save(providerCreditTx);

            // 3. IMMEDIATELY DEBIT 15% commission from provider's wallet
            providerWallet.balance = Number(providerWallet.balance) - Number(commissionAmount);
            await manager.save(providerWallet);

            const providerCommissionTx = this.transactionRepo.create({
                walletId: providerWallet.id,
                amount: -commissionAmount,
                type: WalletTransactionType.COMMISSION,
                status: WalletTransactionStatus.SUCCESS,
                description: `Platform Provider Commission (15%) for service: ${description}`,
                reference: orderId
            });
            await manager.save(providerCommissionTx);

            // 4. Credit total commission (30%) to platform wallet
            const totalPlatformCommission = commissionAmount * 2;
            const PLATFORM_REVENUE_ID = 'PLATFORM_SYSTEM_REVENUE';
            let platformWallet = await manager.findOne(Wallet, { where: { userId: PLATFORM_REVENUE_ID } });

            if (!platformWallet) {
                platformWallet = manager.create(Wallet, {
                    userId: PLATFORM_REVENUE_ID,
                    balance: 0,
                    currency: providerWallet.currency,
                    onboardingComplete: true,
                    isActivated: true
                });
            }

            platformWallet.balance = Number(platformWallet.balance) + Number(totalPlatformCommission);
            await manager.save(platformWallet);

            const platformTx = this.transactionRepo.create({
                walletId: platformWallet.id,
                amount: totalPlatformCommission,
                type: WalletTransactionType.COMMISSION,
                status: WalletTransactionStatus.SUCCESS,
                description: `Received Platform Commission (15% from Patient + 15% from Provider) for service: ${description}`,
                reference: orderId
            });
            await manager.save(platformTx);

            this.logger.log(`Service processed: Total ${amount}, Total Commission ${totalPlatformCommission} routed to platform.`);

            // Notify Sender (Requester/Patient)
            await this.notificationsService.createNotification({
                userId: requesterId,
                type: 'payment',
                title: 'Payment Successful',
                message: `You have paid ${amount} ${requesterWallet.currency} for: ${description}. A service fee of ${commissionAmount} was also applied.`,
                data: { amount, currency: requesterWallet.currency, description, orderId }
            });

            // Notify Provider
            await this.notificationsService.createNotification({
                userId: providerId,
                type: 'payment',
                title: 'Payment Received',
                message: `You have received ${amount} ${providerWallet.currency} for: ${description}. A commission of ${commissionAmount} was deducted.`,
                data: { amount, currency: providerWallet.currency, commissionAmount, description, orderId }
            });

            return {
                status: 'success',
                commission: totalPlatformCommission,
                amount: amount,
                totalCharged: totalDeductionFromRequester
            };
        });
    }

    async getTransactionHistory(userId: string) {
        const wallet = await this.getOrCreateWallet(userId);
        return await this.transactionRepo.find({
            where: { walletId: wallet.id },
            order: { createdAt: 'DESC' }
        });
    }
}
