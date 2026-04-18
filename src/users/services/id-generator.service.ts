import { Injectable } from '@nestjs/common';
import { CenterType } from '../../centers/enum/center-type.enum';

@Injectable()
export class IdGeneratorService {
  private static readonly PREFIXES = {
    patient: 'PT',
    doctor: 'DR',
    facility: 'FC',
    admin: 'AD',
  };

  generateDisplayId(role: string): string {
    const prefix = IdGeneratorService.PREFIXES[role] || 'USR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  generateCenterId(centerType: string): string {
    const typeMap = {
      [CenterType.HOSPITAL]: 'HSP',
      [CenterType.PHARMACY]: 'PHM',
      [CenterType.CLINIC]: 'CLN',
      [CenterType.LABORATORY]: 'LAB',
      [CenterType.RADIOLOGY]: 'RAD',
      [CenterType.DENTAL]: 'DNT',
      [CenterType.EYE]: 'EYE',
      [CenterType.MATERNITY]: 'MAT',
      [CenterType.AMBULANCE]: 'AMB',
      [CenterType.VIROLOGY]: 'VIR',
      [CenterType.PSYCHIATRIC]: 'PSY',
      [CenterType.CARE_HOME]: 'CHM',
      [CenterType.HOSPICE]: 'HOS',
      [CenterType.FUNERAL]: 'FNR',
      default: 'CTR'
    };
    
    const prefix = typeMap[centerType] || typeMap.default;
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}
