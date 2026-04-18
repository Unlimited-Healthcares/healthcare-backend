
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGatewayService } from './payment-gateway.service';
import { HealthcareApiService } from './healthcare-api.service';
import { InsuranceVerificationService } from './insurance-verification.service';
import { SmsService } from './sms.service';
import { IntegrationsController } from './integrations.controller';
import { AuditModule } from '../audit/audit.module';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveWebhookController } from './webhooks/flutterwave-webhook.controller';
import { PaystackWebhookController } from './webhooks/paystack-webhook.controller';
import { PaystackService } from './paystack.service';
import { BinanceService } from './binance.service';
import { BinanceWebhookController } from './webhooks/binance-webhook.controller';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Profile } from '../users/entities/profile.entity';
import { Payment } from './entities/payment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    AuditModule,
    AdminModule,
    TypeOrmModule.forFeature([HealthcareCenter, Profile, Payment, Appointment]),
  ],
  controllers: [
    IntegrationsController,
    FlutterwaveWebhookController,
    PaystackWebhookController,
    BinanceWebhookController,
  ],
  providers: [
    HealthcareApiService,
    InsuranceVerificationService,
    PaymentGatewayService,
    SmsService,
    FlutterwaveService,
    PaystackService,
    BinanceService,
  ],
  exports: [
    HealthcareApiService,
    InsuranceVerificationService,
    PaymentGatewayService,
    SmsService,
    FlutterwaveService,
    PaystackService,
    BinanceService,
  ],
})
export class IntegrationsModule { }
