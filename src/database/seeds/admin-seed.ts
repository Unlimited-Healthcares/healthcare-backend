import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../users/entities/profile.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(Profile);

  const adminEmail = 'admin@unlimitedhealthcares.com';
  
  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('👤 Admin already exists, bypassing...');
    return;
  }

  console.log('👤 Creating platform administrator account...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('AdminPassword2026!', 10);
  const adminUser = userRepository.create({
    email: adminEmail,
    password: hashedPassword,
    roles: ['admin', 'patient'],
    isActive: true,
    isEmailVerified: true,
    kycStatus: 'APPROVED'
  });

  const savedUser = await userRepository.save(adminUser);

  // Create admin profile
  const adminProfile = profileRepository.create({
    userId: savedUser.id,
    firstName: 'Platform',
    lastName: 'Administrator',
    displayName: 'Super Admin',
    gender: 'Other',
    address: 'System HQ',
  });

  await profileRepository.save(adminProfile);

  console.log(`✅ Admin account created: ${adminEmail} / AdminPassword2026!`);
}
