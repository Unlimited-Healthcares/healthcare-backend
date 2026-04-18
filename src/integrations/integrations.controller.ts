import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentGatewayService, PaymentData } from './payment-gateway.service';
import { HealthcareApiService, ProviderSearchData } from './healthcare-api.service';
import { InsuranceVerificationService, InsuranceData } from './insurance-verification.service';
import { SmsService, SmsData } from './sms.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(
    private readonly paymentService: PaymentGatewayService,
    private readonly healthcareApiService: HealthcareApiService,
    private readonly insuranceService: InsuranceVerificationService,
    private readonly smsService: SmsService,
  ) { }

  @Post('payments/process')
  @Roles('admin', 'center', 'doctor', 'patient')
  async processPayment(@Body() paymentData: PaymentData) {
    return await this.paymentService.processPayment(paymentData);
  }

  @Get('payments/:id/status')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  async getPaymentStatus(@Param('id') paymentId: string) {
    return await this.paymentService.getPaymentStatus(paymentId);
  }

  @Post('insurance/verify')
  @Roles('admin', 'doctor', 'staff')
  async verifyInsurance(@Body() insuranceData: InsuranceData) {
    return await this.insuranceService.verifyInsurance(insuranceData);
  }

  @Get('insurance/:id/benefits')
  @Roles('admin', 'doctor', 'staff')
  async getInsuranceBenefits(@Param('id') insuranceId: string) {
    return await this.insuranceService.getBenefits(insuranceId);
  }

  @Post('healthcare/lookup')
  @Roles('admin', 'doctor', 'staff')
  async lookupProvider(@Body() searchData: ProviderSearchData) {
    return await this.healthcareApiService.lookupProvider(searchData);
  }

  @Post('sms/send')
  @Roles('admin', 'doctor', 'staff', 'center')
  async sendSms(@Body() smsData: SmsData) {
    return await this.smsService.sendSms(smsData);
  }

  @Get('sms/:id/status')
  @Roles('admin', 'doctor', 'staff', 'center')
  async getSmsStatus(@Param('id') smsId: string) {
    return await this.smsService.getSmsStatus(smsId);
  }
}
