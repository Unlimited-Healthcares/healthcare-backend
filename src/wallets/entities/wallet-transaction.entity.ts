import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum WalletTransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    SERVICE_PAYMENT = 'service_payment',
    COMMISSION = 'commission',
    REFUND = 'refund',
    TRANSFER = 'transfer',
    ACTIVATION = 'activation',
}

export enum WalletTransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

@Entity('wallet_transactions')
export class WalletTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    walletId: string;

    @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
    @JoinColumn({ name: 'walletId' })
    wallet: Wallet;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: WalletTransactionType,
    })
    type: WalletTransactionType;

    @Column({
        type: 'enum',
        enum: WalletTransactionStatus,
        default: WalletTransactionStatus.PENDING,
    })
    status: WalletTransactionStatus;

    @Column({ nullable: true })
    reference: string; // Internal or External ref (e.g., Paystack Ref, Order ID)

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    metadata: string; // JSON string for additional data

    @CreateDateColumn()
    createdAt: Date;
}
