import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordVersion } from './entities/medical-record-version.entity';
import { MedicalRecord } from './entities/medical-record.entity';

interface VersionData {
  title?: string;
  description?: string;
  recordType?: string;
  category?: string;
  tags?: string[];
  recordData?: Record<string, unknown>;
}

@Injectable()
export class MedicalRecordVersionsService {
  constructor(
    @InjectRepository(MedicalRecordVersion)
    private versionsRepository: Repository<MedicalRecordVersion>,
    @InjectRepository(MedicalRecord)
    private recordsRepository: Repository<MedicalRecord>,
  ) {}

  async getVersionHistory(recordId: string): Promise<MedicalRecordVersion[]> {
    return await this.versionsRepository.find({
      where: { recordId },
      order: { versionNumber: 'DESC' },
      relations: ['creator'],
    });
  }

  async getVersionById(versionId: string): Promise<MedicalRecordVersion> {
    const version = await this.versionsRepository.findOne({
      where: { id: versionId },
      relations: ['creator', 'record'],
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  async revertToVersion(recordId: string, versionNumber: number, userId: string): Promise<MedicalRecord> {
    // Get the version to revert to
    const targetVersion = await this.versionsRepository.findOne({
      where: { recordId, versionNumber },
    });

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    // Get current record
    const currentRecord = await this.recordsRepository.findOne({
      where: { id: recordId },
    });

    if (!currentRecord) {
      throw new NotFoundException('Record not found');
    }

    // Create new version from current state before reverting
    const newVersion = this.versionsRepository.create({
      recordId,
      versionNumber: currentRecord.version,
      title: currentRecord.title,
      description: currentRecord.description,
      recordType: currentRecord.recordType,
      previousData: {
        title: currentRecord.title,
        description: currentRecord.description,
        recordType: currentRecord.recordType,
        category: currentRecord.category,
        tags: currentRecord.tags,
        recordData: currentRecord.recordData,
      },
      changesSummary: `Reverted to version ${versionNumber}`,
      createdBy: userId,
    });

    await this.versionsRepository.save(newVersion);

    // Update current record with data from target version
    const revertData = targetVersion.previousData as VersionData;
    await this.recordsRepository.update(recordId, {
      title: revertData.title,
      description: revertData.description,
      recordType: revertData.recordType,
      category: revertData.category,
      tags: revertData.tags,
      recordData: revertData.recordData,
      version: currentRecord.version + 1,
      updatedAt: new Date(),
    });

    return await this.recordsRepository.findOne({ where: { id: recordId } });
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<{
    version1: MedicalRecordVersion;
    version2: MedicalRecordVersion;
    differences: Record<string, { from: unknown; to: unknown }>;
  }> {
    const [version1, version2] = await Promise.all([
      this.getVersionById(versionId1),
      this.getVersionById(versionId2),
    ]);

    const differences = this.calculateDifferences(
      version1.previousData,
      version2.previousData,
    );

    return {
      version1,
      version2,
      differences,
    };
  }

  private calculateDifferences(data1: Record<string, unknown>, data2: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> {
    const differences: Record<string, { from: unknown; to: unknown }> = {};

    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    for (const key of allKeys) {
      if (data1[key] !== data2[key]) {
        differences[key] = {
          from: data1[key],
          to: data2[key],
        };
      }
    }

    return differences;
  }
}
