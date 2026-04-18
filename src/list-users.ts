import dataSource from './datasource';
import { User } from './users/entities/user.entity';

async function listUsers() {
    try {
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
        }
        const userRepository = dataSource.getRepository(User);
        const users = await userRepository.find();
        console.log('--- Users List ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.email}, Roles: ${u.roles}, KYC: ${u.kycStatus}`);
        });
        console.log('------------------');
    } catch (error) {
        console.error(error);
    } finally {
        await dataSource.destroy();
    }
}

listUsers();
