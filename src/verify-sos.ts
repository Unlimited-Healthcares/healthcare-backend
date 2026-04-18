import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Profile } from '../src/users/entities/profile.entity';
import { EmergencyContact } from '../src/emergency/entities/emergency-contact.entity';
import { EmergencyAlert } from '../src/emergency/entities/emergency-alert.entity';
import { SmsService } from '../src/integrations/sms.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

async function run() {
    // 1. Setup Data Source
    dotenv.config({ path: '.env.development' });

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
        username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || process.env.DB_NAME || 'healthcare',
        ssl: (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
        entities: [User, Profile, EmergencyContact, EmergencyAlert],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        // 2. Find latest user
        const latestUser = await dataSource.getRepository(User).findOne({
            where: {},
            order: { createdAt: 'DESC' }
        });

        if (!latestUser) {
            console.error('❌ No user found in database');
            return;
        }
        console.log(`👤 Testing for user: ${latestUser.email} (${latestUser.id})`);

        // 3. Add Emergency Contact
        const contactRepo = dataSource.getRepository(EmergencyContact);

        // Remove existing test contacts for this user to keep it clean
        await contactRepo.delete({ userId: latestUser.id, contactPhone: '+2349132175272' });

        const contact = contactRepo.create({
            userId: latestUser.id,
            contactName: 'Omogo Peter Onyedika',
            contactPhone: '+2349132175272',
            relationship: 'Friend',
            isPrimary: true,
            isActive: true,
            notificationPreferences: { sms: true, email: true, voice_call: false }
        });
        await contactRepo.save(contact);
        console.log('📞 Emergency contact added');

        // 4. Trigger Mock SOS (Proof of concept for the flow)
        const configService = new ConfigService();
        const smsService = new SmsService(configService);

        const locationUrl = `https://www.google.com/maps?q=6.5244,3.3792`; // Mock Lagos location
        const message = `EMERGENCY: ${latestUser.email.split('@')[0]} has sent an SOS alert! Alert: TEST-PROD-VERIFY. Location: ${locationUrl}. Call 911 if needed.`;

        console.log(`🚀 Triggering TEST SOS to ${contact.contactPhone}...`);

        if (process.env.SENDCHAMP_API_KEY) {
            try {
                interface SendchampResponse {
                    code: number;
                    status: string;
                    message: string;
                    data?: {
                        business_id?: string;
                    };
                }

                // Use type assertion to a known structure instead of any
                const sendchampSms = (smsService as unknown as { sendchamp: { SMS: { send: (params: unknown) => Promise<SendchampResponse> } } }).sendchamp.SMS;
                const response = await sendchampSms.send({
                    to: [contact.contactPhone.replace('+', '')],
                    message: message,
                    sender_name: process.env.SENDCHAMP_SENDER_ID || 'Sendchamp',
                    route: 'dnd',
                });
                console.log('📦 Raw Sendchamp Response:', JSON.stringify(response, null, 2));

                if (response.code === 200 || response.status === 'success') {
                    console.log(`✅ SMS Sent Successfully! ID: ${response.data?.business_id}`);
                } else {
                    console.log(`❌ SMS Failed: ${response.message || 'Unknown error'}`);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('❌ Direct Sendchamp Error:', errorMessage);
            }
        } else {
            console.log('⚠️ SENDCHAMP_API_KEY not found. Running in MOCK mode.');
            console.log(`[MOCK SMS] to ${contact.contactPhone}: ${message}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await dataSource.destroy();
    }
}

run();
