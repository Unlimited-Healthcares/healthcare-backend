
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { BloodDonor } from './entities/blood-donor.entity';
import { BloodDonationRequest } from './entities/blood-donation-request.entity';
import { BloodDonation } from './entities/blood-donation.entity';
import { BloodInventory } from './entities/blood-inventory.entity';
import { DonorReward } from './entities/donor-reward.entity';
import { DonorVerification } from './entities/donor-verification.entity';
import { DonationAppointment } from './entities/donation-appointment.entity';

// Services
import { BloodDonorsService } from './services/blood-donors.service';
import { BloodDonationRequestsService } from './services/blood-donation-requests.service';
import { BloodDonationsService } from './services/blood-donations.service';
import { BloodInventoryService } from './services/blood-inventory.service';
import { BloodCompatibilityService } from './services/blood-compatibility.service';

// Controllers
import { BloodDonorsController } from './controllers/blood-donors.controller';
import { BloodDonationRequestsController } from './controllers/blood-donation-requests.controller';
import { BloodDonationsController } from './controllers/blood-donations.controller';
import { BloodInventoryController } from './controllers/blood-inventory.controller';
import { BloodDonationAnalyticsController } from './controllers/blood-donation-analytics.controller';

// External modules
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BloodDonor,
      BloodDonationRequest,
      BloodDonation,
      BloodInventory,
      DonorReward,
      DonorVerification,
      DonationAppointment,
    ]),
    NotificationsModule,
    IntegrationsModule,
  ],
  controllers: [
    BloodDonorsController,
    BloodDonationRequestsController,
    BloodDonationsController,
    BloodInventoryController,
    BloodDonationAnalyticsController,
  ],
  providers: [
    BloodDonorsService,
    BloodDonationRequestsService,
    BloodDonationsService,
    BloodInventoryService,
    BloodCompatibilityService,
  ],
  exports: [
    BloodDonorsService,
    BloodDonationRequestsService,
    BloodDonationsService,
    BloodInventoryService,
    BloodCompatibilityService,
  ],
})
export class BloodDonationModule { }
