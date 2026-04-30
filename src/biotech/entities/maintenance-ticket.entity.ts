import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Equipment } from './equipment.entity';

export enum TicketPriority {
    CRITICAL = 'Critical',
    HIGH = 'High',
    ROUTINE = 'Routine'
}

export enum TicketStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

@Entity('maintenance_tickets')
export class MaintenanceTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ticketNumber: string;

    @ManyToOne(() => Equipment)
    equipment: Equipment;

    @Column()
    equipmentId: string;

    @ManyToOne(() => User)
    reporter: User;

    @Column()
    reporterId: string;

    @ManyToOne(() => User, { nullable: true })
    assignedEngineer: User;

    @Column({ nullable: true })
    assignedEngineerId: string;

    @Column('text')
    issueDescription: string;

    @Column({
        type: 'enum',
        enum: TicketPriority,
        default: TicketPriority.ROUTINE
    })
    priority: TicketPriority;

    @Column({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.PENDING
    })
    status: TicketStatus;

    @Column('text', { nullable: true })
    resolutionNotes: string;

    @Column({ type: 'jsonb', nullable: true })
    diagnosticLogs: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
