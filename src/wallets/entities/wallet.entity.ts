import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('wallets')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    balance: number;

    @Column({ length: 10, default: 'USD' })
    currency: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 25.00 })
    minimumTopUpAmount: number;

    @Column({ default: false })
    isAutoTopUpEnabled: boolean;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 10.00 })
    rechargeThreshold: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 50.00 })
    rechargeAmount: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 500.00 })
    monthlySpendMax: number;

    @Column({ default: false })
    onboardingComplete: boolean;

    @Column({ default: false })
    isActivated: boolean;

    @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet)
    transactions: WalletTransaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
