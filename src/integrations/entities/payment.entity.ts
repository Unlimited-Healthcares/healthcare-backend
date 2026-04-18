import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'reference', unique: true })
    reference: string;

    @Column({ name: 'transaction_id', nullable: true })
    transactionId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 10, default: 'USD' })
    currency: string;

    @Column({ default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ name: 'payment_method' })
    paymentMethod: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'center_id' })
    centerId: string;

    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: string;

    @Column({ name: 'request_id', nullable: true })
    requestId: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown>;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
