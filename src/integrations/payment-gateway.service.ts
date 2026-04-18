import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaystackService } from './paystack.service';
import { FlutterwaveService } from './flutterwave.service';
import { BinanceService } from './binance.service';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Profile } from '../users/entities/profile.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SystemConfigurationService } from '../admin/services/system-configuration.service';


export interface PaymentData {
  amount: number;
  currency: string;
  patientId: string;
  centerId: string;
  description: string;
  paymentMethod: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  transactionId?: string;
  errorMessage?: string;
  redirectUrl?: string;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly binanceService: BinanceService,
    @InjectRepository(HealthcareCenter)
    private readonly centerRepository: Repository<HealthcareCenter>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly systemConfigService: SystemConfigurationService,
    private readonly dataSource: DataSource,
  ) { }


  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      this.logger.log(`Processing payment for ${paymentData.amount} ${paymentData.currency} using ${paymentData.paymentMethod}`);

      // Check for global transaction halt
      const isHalted = await this.systemConfigService.getFeatureFlag('halt_transactions');
      if (isHalted) {
        throw new Error('Platform transactions are temporarily halted for security maintenance. Please try again later.');
      }

      const method = paymentData.paymentMethod?.toLowerCase();
      const prefix = method === 'paystack' ? 'PS' : method === 'binance' ? 'BN' : 'FLW';
      const reference = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Fetch center to get subaccount details if present
      let center: HealthcareCenter | null = null;
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const isPlatformPayment = !paymentData.centerId || paymentData.centerId === '' || paymentData.centerId === 'platform';

      if (paymentData.centerId && isUuid(paymentData.centerId)) {
        center = await this.centerRepository.findOne({ where: { id: paymentData.centerId } });
      }

      // Create initial pending payment record
      const paymentRecord = this.paymentRepository.create({
        reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: PaymentStatus.PENDING,
        paymentMethod: method,
        patientId: paymentData.patientId,
        centerId: paymentData.centerId,
        appointmentId: paymentData.metadata?.appointmentId as string,
        metadata: paymentData.metadata,
      });
      await this.paymentRepository.save(paymentRecord);

      // Handle Paystack
      if (method === 'paystack') {
        try {
          // Find Paystack subaccount
          let subaccount: string | undefined;
          if (center) {
            subaccount = center.paymentSettings?.methods?.find(m => m.type === 'paystack')?.details?.subaccount;
          } else if (paymentData.centerId && isUuid(paymentData.centerId)) {
            const profile = await this.profileRepository.findOne({ where: { user: { id: paymentData.centerId } }, relations: ['user'] });
            subaccount = profile?.paymentSettings?.methods?.find(m => m.type === 'paystack')?.details?.subaccount;
          }

          if (!isPlatformPayment && !subaccount) {
            throw new Error(`Transaction failed: Center or doctor does not have a Paystack subaccount code configured.`);
          }

          // Dual 15% Commission Logic:
          // Patient pays Amount + 15%
          // Provider gets Amount - 15%
          // Platform takes 15% from each = 30% total
          const isServicePayment = !isPlatformPayment && !!subaccount;
          const totalAmountToCharge = isServicePayment ? Math.round(paymentData.amount * 1.15) : paymentData.amount;
          const platformFeeKobo = isServicePayment ? Math.round(paymentData.amount * 0.30 * 100) : 0;

          const email = (paymentData.metadata?.email as string) || 'customer@example.com';
          // PRIORITY: callbackUrl > redirectUrl > default
          const callbackUrl = (paymentData.metadata?.callbackUrl as string) || (paymentData.metadata?.redirectUrl as string) || 'https://app.unlimitedhealthcares.com/payment/callback';

          const initRes = await this.paystackService.initializeTransaction({
            amount: totalAmountToCharge,
            currency: paymentData.currency,
            email,
            callbackUrl,
            metadata: { ...paymentData.metadata, reference },
            reference: reference,
            subaccount: subaccount,
            transactionCharge: platformFeeKobo
          });

          paymentRecord.transactionId = initRes.data.access_code;
          await this.paymentRepository.save(paymentRecord);

          return {
            id: reference,
            status: 'processing',
            amount: paymentData.amount,
            currency: paymentData.currency,
            transactionId: initRes.data.access_code,
            redirectUrl: initRes.data.authorization_url, // Ensure this maps to authorize_url correctly
          };
        } catch (e) {
          paymentRecord.status = PaymentStatus.FAILED;
          paymentRecord.errorMessage = e.message;
          await this.paymentRepository.save(paymentRecord);
          throw e;
        }
      }

      // Handle Flutterwave
      if (method === 'flutterwave') {
        try {
          let subaccount: string | undefined;
          if (center) {
            subaccount = center.paymentSettings?.methods?.find(m => m.type === 'flutterwave')?.details?.subaccount;
          } else if (paymentData.centerId && isUuid(paymentData.centerId)) {
            const profile = await this.profileRepository.findOne({ where: { user: { id: paymentData.centerId } }, relations: ['user'] });
            subaccount = profile?.paymentSettings?.methods?.find(m => m.type === 'flutterwave')?.details?.subaccount;
          }

          if (!isPlatformPayment && !subaccount) {
            throw new Error(`Transaction failed: Center or doctor does not have a Flutterwave subaccount code configured.`);
          }

          // Dual 15% Commission Logic:
          // Patient pays Amount + 15%
          // Provider gets Amount - 15%
          // Platform takes 15% from each = 30% total
          const isServicePayment = !isPlatformPayment && !!subaccount;
          const totalAmountToCharge = isServicePayment ? paymentData.amount * 1.15 : paymentData.amount;
          const commissionFee = isServicePayment ? paymentData.amount * 0.30 : 0;

          const email = (paymentData.metadata?.email as string) || 'customer@example.com';
          const callbackUrl = (paymentData.metadata?.callbackUrl as string) || (paymentData.metadata?.redirectUrl as string) || 'https://app.unlimitedhealthcares.com/payment/callback';

          const initRes = await this.flutterwaveService.initializePayment({
            amount: totalAmountToCharge,
            currency: paymentData.currency,
            email,
            fullName: (paymentData.metadata?.fullName as string) || 'Customer',
            orderId: reference,
            orderNumber: reference,
            redirectUrl: callbackUrl,
            subaccount: subaccount,
            commissionFee: commissionFee,
            meta: { reference }
          });

          paymentRecord.transactionId = initRes.data.tx_ref;
          await this.paymentRepository.save(paymentRecord);

          return {
            id: reference,
            status: 'processing',
            amount: paymentData.amount,
            currency: paymentData.currency,
            transactionId: initRes.data.tx_ref,
            redirectUrl: initRes.data.link, // Flutterwave uses link
          };
        } catch (e) {
          paymentRecord.status = PaymentStatus.FAILED;
          paymentRecord.errorMessage = e.message;
          await this.paymentRepository.save(paymentRecord);
          throw e;
        }
      }

      // Handle Binance Pay
      if (method === 'binance') {
        try {
          const callbackUrl = (paymentData.metadata?.callbackUrl as string) || (paymentData.metadata?.redirectUrl as string) || 'https://app.unlimitedhealthcares.com/payment/callback';

          const initRes = await this.binanceService.createOrder({
            amount: paymentData.amount,
            currency: paymentData.currency,
            description: paymentData.description,
            orderId: reference,
            callbackUrl: callbackUrl
          });

          paymentRecord.transactionId = initRes.prepayId;
          await this.paymentRepository.save(paymentRecord);

          return {
            id: reference,
            status: 'processing',
            amount: paymentData.amount,
            currency: paymentData.currency,
            transactionId: initRes.prepayId,
            redirectUrl: initRes.checkoutUrl,
          };
        } catch (e) {
          paymentRecord.status = PaymentStatus.FAILED;
          paymentRecord.errorMessage = e.message;
          await this.paymentRepository.save(paymentRecord);
          throw e;
        }
      }

      // Handle Flutterwave Bank Transfer (Payouts)
      if (method === 'bank_transfer') {
        try {
          // This is a payout/transfer
          // In a real system, we'd fetch the recipient's bank details from their profile
          // For now, we'll mark it as pending and log the transfer attempt
          this.logger.log(`Initiating bank transfer payout for ${paymentData.amount} ${paymentData.currency}`);

          return {
            id: reference,
            status: 'processing',
            amount: paymentData.amount,
            currency: paymentData.currency,
            transactionId: `TRF-${Date.now()}`,
            errorMessage: 'Bank transfer initiated. Awaiting confirmation.',
          };
        } catch (e) {
          paymentRecord.status = PaymentStatus.FAILED;
          paymentRecord.errorMessage = e.message;
          await this.paymentRepository.save(paymentRecord);
          throw e;
        }
      }

      throw new Error(`Unsupported payment method: ${paymentData.paymentMethod}`);
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    this.logger.log(`Verifying payment status for: ${paymentId}`);

    try {
      let isSuccess = false;
      let transactionId = '';
      let amount = 0;
      let currency = 'NGN';

      if (paymentId.startsWith('PS-')) {
        const verification = await this.paystackService.verifyTransaction(paymentId);
        isSuccess = this.paystackService.isPaymentSuccessful(verification);
        transactionId = verification.data.id.toString();
        amount = verification.data.amount / 100;
        currency = verification.data.currency;
      } else if (paymentId.startsWith('FLW-') || paymentId.startsWith('ORD-')) {
        const verification = await this.flutterwaveService.verifyByTxRef(paymentId);
        isSuccess = this.flutterwaveService.isPaymentSuccessful(verification);
        transactionId = verification.data?.id?.toString();
        amount = verification.data?.amount;
        currency = verification.data?.currency;
      }

      if (isSuccess) {
        await this.updateRelatedEntities(paymentId, PaymentStatus.SUCCEEDED, transactionId);
      }

      return {
        id: paymentId,
        status: isSuccess ? 'succeeded' : 'failed',
        amount: amount,
        currency: currency,
        transactionId: transactionId,
        errorMessage: isSuccess ? undefined : 'Payment verification failed',
      };
    } catch (error) {
      this.logger.error(`Status verification failed: ${error.message}`);
      return { id: paymentId, status: 'failed', amount: 0, currency: 'USD', errorMessage: error.message };
    }
  }

  async handleWebhookNotification(data: { gateway: string, orderId: string, status: string, rawPayload?: any }) {
    this.logger.log(`Handling webhook for ${data.gateway} order ${data.orderId}`);

    if (data.status === 'succeeded') {
      const reference = data.orderId;
      await this.updateRelatedEntities(reference, PaymentStatus.SUCCEEDED, data.rawPayload?.transactionId || data.rawPayload?.id);
    }
  }

  async updateRelatedEntities(reference: string, status: PaymentStatus, transactionId?: string) {
    const payment = await this.paymentRepository.findOne({ where: { reference } });
    if (!payment) return;

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    await this.paymentRepository.save(payment);

    if (status !== PaymentStatus.SUCCEEDED) return;

    // 1. Handle Appointment Confirmation
    if (payment.appointmentId) {
      await this.appointmentRepository.update(payment.appointmentId, {
        appointmentStatus: 'confirmed',
        status: 'paid',
        metadata: { ...payment.metadata, paidAt: new Date().toISOString(), paymentId: payment.id }
      });
      this.logger.log(`Confirmed appointment ${payment.appointmentId} via payment ${payment.id}`);
    }

    // 2. Handle Request Payment Verification
    if (payment.metadata?.requestId) {
      // We use the request ID from metadata
      const requestId = payment.metadata.requestId as string;
      // Since we don't want to inject RequestsService (circular), we use direct repository update or data source
      await this.dataSource.createQueryBuilder()
        .update('user_requests')
        .set({ paymentStatus: 'paid', paymentReference: reference })
        .where('id = :requestId', { requestId })
        .execute();
      this.logger.log(`Verified payment for request ${requestId}`);
    }

    // 3. Handle Subscription/Premium Upgrade
    const planId = payment.metadata?.planId as string;
    if (planId && payment.patientId) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

      await this.profileRepository.update({ userId: payment.patientId }, {
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        subscriptionExpiry: expiryDate
      });
      this.logger.log(`Upgraded user ${payment.patientId} to plan ${planId}`);
    }

    // 4. Handle Wallet Activation / Account Activation
    if (payment.metadata?.type === 'account_activation' && payment.patientId) {
      await this.profileRepository.update({ userId: payment.patientId }, {
        subscriptionStatus: 'active'
      });
    }

    // 5. Handle Wallet Funding
    if (payment.metadata?.type === 'wallet_funding' && payment.metadata?.walletId) {
      const amount = payment.amount;
      // Directly update wallet balance to avoid circular dependency
      await this.dataSource.createQueryBuilder()
        .update('wallets')
        .set({ balance: () => `balance + ${amount}` })
        .where('id = :walletId', { walletId: payment.metadata.walletId })
        .execute();

      // Also log a transaction
      await this.dataSource.createQueryBuilder()
        .insert()
        .into('wallet_transactions')
        .values({
          walletId: payment.metadata.walletId,
          amount: amount,
          type: 'deposit',
          status: 'succeeded',
          description: 'Wallet top-up via payment gateway',
          reference: reference,
          metadata: payment.metadata
        })
        .execute();

      this.logger.log(`Funded wallet ${payment.metadata.walletId} with ${amount}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<RefundResult> {
    this.logger.log(`Processing refund for payment: ${paymentId}`);

    // Mock refund processing
    return {
      id: `rf_${Date.now()}`,
      paymentId,
      amount: amount || 0,
      status: 'succeeded',
    };
  }

  async createPaymentIntent(paymentData: PaymentData): Promise<PaymentIntent> {
    this.logger.log(`Creating payment intent for ${paymentData.amount} ${paymentData.currency}`);

    // Mock payment intent creation
    return {
      id: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random()}`,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'requires_payment_method',
    };
  }
}
