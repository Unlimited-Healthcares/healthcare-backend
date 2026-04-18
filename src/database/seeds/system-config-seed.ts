import { DataSource, FindOptionsWhere } from 'typeorm';
import { SystemConfiguration, ConfigType } from '../../admin/entities/system-configuration.entity';
import { User } from '../../users/entities/user.entity';

export async function seedSystemConfig(dataSource: DataSource): Promise<void> {
    const configRepository = dataSource.getRepository(SystemConfiguration);
    const userRepository = dataSource.getRepository(User);

    console.log('⚙️ Seeding system configurations...');

    // Get an admin user to use as creator
    const admin = await userRepository.findOne({
        where: { email: 'admin@unlimitedhealthcares.com' }
    });

    if (!admin) {
        console.warn('⚠️ Admin user not found, skipping system config seeding. (Run admin seed first)');
        return;
    }

    const configurations = [
        {
            configKey: 'ai_assistance_enabled',
            configValue: { enabled: true },
            configType: ConfigType.FEATURE_FLAG,
            description: 'Enables the Smart Triage AI Assistant',
            isActive: true,
            createdBy: admin.id,
        },
        {
            configKey: 'maintenance_mode',
            configValue: { enabled: false, message: 'System is under maintenance. Please try again later.' },
            configType: ConfigType.MAINTENANCE,
            description: 'Globally toggles maintenance mode',
            isActive: true,
            createdBy: admin.id,
        },
        {
            configKey: 'user_registration_enabled',
            configValue: { enabled: true },
            configType: ConfigType.FEATURE_FLAG,
            description: 'Toggles public user registration',
            isActive: true,
            createdBy: admin.id,
        }
    ];

    for (const configData of configurations) {
        const where: FindOptionsWhere<SystemConfiguration> = { configKey: configData.configKey as string };
        const existing = await configRepository.findOne({
            where
        });

        if (existing) {
            console.log(`ℹ️ Configuration ${configData.configKey} already exists, updating...`);
            Object.assign(existing, configData);
            await configRepository.save(existing);
        } else {
            console.log(`➕ Creating configuration ${configData.configKey}...`);
            const config = configRepository.create(configData);
            await configRepository.save(config);
        }
    }

    console.log('✅ System configurations seeded successfully');
}
