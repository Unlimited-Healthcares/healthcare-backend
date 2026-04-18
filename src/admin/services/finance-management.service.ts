import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../../integrations/entities/payment.entity';
import { WalletTransaction, WalletTransactionType, WalletTransactionStatus } from '../../wallets/entities/wallet-transaction.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Injectable()
export class FinanceManagementService {
    private readonly logger = new Logger(FinanceManagementService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(WalletTransaction)
        private readonly transactionRepository: Repository<WalletTransaction>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(HealthcareCenter)
        private readonly centerRepository: Repository<HealthcareCenter>,
    ) { }

    async getFinanceStats() {
        this.logger.log('Fetching real-time platform financial metrics');

        // 1. Total Volume (Sum of all succeeded payments)
        const volumeRes = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'total')
            .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
            .getRawOne();

        const totalVolume = parseFloat(volumeRes?.total || '0');

        // 2. Total Commissions (Sum of platform revenue wallet or commission transactions)
        const commissionRes = await this.transactionRepository
            .createQueryBuilder('tx')
            .select('SUM(tx.amount)', 'total')
            .where('tx.type = :type', { type: WalletTransactionType.COMMISSION })
            .andWhere('tx.status = :status', { status: WalletTransactionStatus.SUCCESS })
            .andWhere('tx.amount > 0') // Platform credits (since commissions are debited from users and credited to platform)
            .getRawOne();

        const totalCommissions = parseFloat(commissionRes?.total || '0');

        // 3. Breakdown by Gateway
        const gateways = ['binance', 'paystack', 'flutterwave'];
        const gatewayStats: Record<string, number> = {};

        for (const gateway of gateways) {
            const res = await this.paymentRepository
                .createQueryBuilder('payment')
                .select('SUM(payment.amount)', 'total')
                .where('payment.paymentMethod = :gateway', { gateway })
                .andWhere('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
                .getRawOne();

            gatewayStats[gateway] = parseFloat(res?.total || '0');
        }

        // 4. Proxy query for centers with any payment config
        // Proxy query for centers with any payment config
        const subaccountRes = await this.centerRepository
            .createQueryBuilder('center')
            .where("center.paymentSettings IS NOT NULL")
            .getCount();

        return {
            totalRevenue: totalVolume,
            binanceTotal: gatewayStats.binance,
            paystackTotal: gatewayStats.paystack,
            flutterwaveTotal: gatewayStats.flutterwave,
            platformFees: totalCommissions,
            activeSubaccounts: subaccountRes,
        };
    }

    async getGlobalLedger(limit: number = 50) {
        return await this.transactionRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['wallet', 'wallet.user']
        });
    }
}
