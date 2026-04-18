
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { User } from './entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LicenseExpiryCronService {
    private readonly logger = new Logger(LicenseExpiryCronService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Runs daily to check for professional licenses entering the 
     * "Yellow" window (less than 3 months left) or which have expired.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleLicenseExpiryChecks() {
        this.logger.log('Running daily license expiry checks...');

        try {
            const now = new Date();
            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(now.getMonth() + 3);

            // 1. Find users whose licenses expire within 3 months (Yellow window)
            // and haven't been notified recently (or we just notify them once a week)
            // For simplicity, let's find all professionals in the window.
            const expiringSoonUsers = await this.userRepository.find({
                where: {
                    licenseExpiryDate: Between(now, threeMonthsFromNow),
                },
                relations: ['profile'],
            });

            this.logger.log(`Found ${expiringSoonUsers.length} professionals with licenses expiring within 3 months`);

            for (const user of expiringSoonUsers) {
                await this.notificationsService.createNotification({
                    userId: user.id,
                    title: 'Professional License Expiring Soon',
                    message: `Your professional license is set to expire on ${user.licenseExpiryDate.toDateString()}. Please renew it soon to avoid service interruption.`,
                    type: 'security_alert',
                    deliveryMethod: 'both', // email and push
                    isUrgent: true,
                });
                this.logger.debug(`Sent expiry warning to user ${user.id}`);
            }

            // 2. Find users whose licenses have JUST expired (Red window)
            const expiredUsers = await this.userRepository.find({
                where: {
                    licenseExpiryDate: LessThan(now),
                },
                relations: ['profile'],
            });

            this.logger.log(`Found ${expiredUsers.length} professionals with expired licenses`);

            for (const user of expiredUsers) {
                // We might want to send a more critical notification here
                await this.notificationsService.createNotification({
                    userId: user.id,
                    title: 'URGENT: Professional License Expired',
                    message: `Your professional license expired on ${user.licenseExpiryDate.toDateString()}. Your ability to accept new appointments has been restricted.`,
                    type: 'security_alert',
                    deliveryMethod: 'both',
                    isUrgent: true,
                });
                this.logger.warn(`Sent expired license alert to user ${user.id}`);
            }

        } catch (error) {
            this.logger.error(`Error in license expiry cron: ${error.message}`);
        }
    }
}
