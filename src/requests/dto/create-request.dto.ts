import { IsString, IsNotEmpty, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiPropertyOptional({ description: 'Recipient user ID' })
  @IsString()
  @IsOptional()
  recipientId?: string;

  @ApiProperty({
    description: 'Type of request',
    enum: ['connection', 'job_application', 'collaboration', 'patient_request', 'staff_invitation', 'referral', 'consultation_request', 'care_task', 'transfer_patient', 'service_quote', 'appointment_proposal', 'treatment_proposal', 'call_request', 'medical_report_proposal', 'prescription_proposal', 'service_interest', 'appointment_invitation', 'lab_order', 'pharmacy_transfer', 'radiology_order']
  })
  @IsString()
  @IsIn(['connection', 'job_application', 'collaboration', 'patient_request', 'staff_invitation', 'referral', 'consultation_request', 'care_task', 'transfer_patient', 'service_quote', 'appointment_proposal', 'treatment_proposal', 'call_request', 'medical_report_proposal', 'prescription_proposal', 'service_interest', 'appointment_invitation', 'lab_order', 'pharmacy_transfer', 'radiology_order'])
  requestType: 'connection' | 'job_application' | 'collaboration' | 'patient_request' | 'staff_invitation' | 'referral' | 'consultation_request' | 'care_task' | 'transfer_patient' | 'service_quote' | 'appointment_proposal' | 'treatment_proposal' | 'call_request' | 'medical_report_proposal' | 'prescription_proposal' | 'service_interest' | 'appointment_invitation' | 'lab_order' | 'pharmacy_transfer' | 'radiology_order';

  @ApiProperty({ description: 'Request message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the request' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
