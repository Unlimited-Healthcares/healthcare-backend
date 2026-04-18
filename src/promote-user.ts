import dataSource from './datasource';
import { User } from './users/entities/user.entity';

async function promoteToAdmin(email: string) {
    try {
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        
        if (!user) {
            console.error(`❌ User with email ${email} not found.`);
            return;
        }

        if (user.roles.includes('admin')) {
            console.log(`ℹ️ User ${email} is already an admin.`);
            return;
        }

        user.roles = [...user.roles, 'admin'];
        await userRepository.save(user);
        console.log(`✅ User ${email} has been promoted to administrator.`);
    } catch (error) {
        console.error('❌ Error promoting user:', error);
    } finally {
        await dataSource.destroy();
    }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
    console.error('Please provide an email address: npx ts-node src/promote-user.ts user@example.com');
} else {
    promoteToAdmin(targetEmail);
}
