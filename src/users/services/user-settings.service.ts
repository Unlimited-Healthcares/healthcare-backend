
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from '../entities/user-settings.entity';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
  ) {}

  async getOrCreateSettings(userId: string): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.userSettingsRepository.create({ userId });
      await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(userId: string, updateData: Partial<UserSettings>): Promise<UserSettings> {
    const settings = await this.getOrCreateSettings(userId);
    Object.assign(settings, updateData);
    return this.userSettingsRepository.save(settings);
  }
}
