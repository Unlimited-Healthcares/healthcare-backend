import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedConsumerEquipmentData1773339167000 implements MigrationInterface {
    name = 'SeedConsumerEquipmentData1773339167000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed Categories
        await queryRunner.query(`
            INSERT INTO "equipment_categories" ("id", "name", "category_code", "description", "is_active", "sort_order")
            VALUES 
            (uuid_generate_v4(), 'Consumer Health', 'CONS_HLTH', 'Blood pressure monitors, thermometers, and home health devices', true, 10),
            (uuid_generate_v4(), 'Wound Care', 'WOUND_CARE', 'Bandages, dressings, and wound treatment supplies', true, 11),
            (uuid_generate_v4(), 'First Aid & Safety', 'FIRST_AID', 'First aid kits, emergency supplies, and safety gear', true, 12),
            (uuid_generate_v4(), 'Personal Protective Equipment', 'PPE', 'Masks, gloves, and protective clothing', true, 13)
            ON CONFLICT ("category_code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description";
        `);

        // 2. Seed Platform Vendor (if not exists)
        await queryRunner.query(`
            INSERT INTO "equipment_vendors" ("id", "company_name", "email", "phone", "verification_status", "rating_average", "total_ratings", "is_active", "description")
            VALUES 
            (uuid_generate_v4(), 'Unlimited Healthcare Store', 'store@unlimitedhealthcare.com', '+234-800-UHC-SHOP', 'verified', 5.0, 500, true, 'Official platform store for medical supplies and equipment')
            ON CONFLICT ("email") DO NOTHING;
        `);

        // 3. Get the IDs we just created to use in the items seed
        const categories = await queryRunner.query(`SELECT id, category_code FROM "equipment_categories"`);
        const vendor = await queryRunner.query(`SELECT id FROM "equipment_vendors" WHERE "email" = 'store@unlimitedhealthcare.com'`);
        
        const catMap = categories.reduce((acc: any, curr: any) => {
            acc[curr.category_code] = curr.id;
            return acc;
        }, {});
        const vendorId = vendor[0].id;

        // 4. Seed Items
        const items = [
            {
                name: 'Digital Blood Pressure Monitor',
                cat: 'CONS_HLTH',
                price: 45.99,
                desc: 'Automatic upper arm blood pressure monitor with large LCD display and 99-reading memory.',
                img: 'https://images.unsplash.com/photo-1631549916768-4119b295f7ef?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Infrared No-Contact Thermometer',
                cat: 'CONS_HLTH',
                price: 29.50,
                desc: 'Instant 1-second temperature reading for kids and adults. Accurate and hygienic.',
                img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Premium Home First Aid Kit (200 Pieces)',
                cat: 'FIRST_AID',
                price: 35.00,
                desc: 'Comprehensive emergency kit for home, car, and office. FDA approved supplies.',
                img: 'https://images.unsplash.com/photo-1603398938378-e54eab446f21?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'KN95 Protective Masks (Pack of 50)',
                cat: 'PPE',
                price: 19.99,
                desc: 'High-filtration 5-ply masks with adjustable nose clip and comfortable ear loops.',
                img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Sterile Gauze Pads (4x4 inch, 100 Pack)',
                cat: 'WOUND_CARE',
                price: 12.75,
                desc: 'Individually wrapped sterile cotton pads for wound cleaning and protection.',
                img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Pulse Oximeter Fingertip Monitor',
                cat: 'CONS_HLTH',
                price: 24.99,
                desc: 'Quickly measures blood oxygen saturation (SpO2) and pulse rate.',
                img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800'
            }
        ];

        for (const item of items) {
            await queryRunner.query(`
                INSERT INTO "equipment_items" 
                ("id", "name", "description", "category_id", "vendor_id", "sale_price", "is_for_sale", "is_rentable", "availability_status", "condition", "images", "is_active", "created_at", "updated_at")
                VALUES 
                (uuid_generate_v4(), '${item.name}', '${item.desc}', '${catMap[item.cat]}', '${vendorId}', ${item.price}, true, false, 'available', 'new', ARRAY['${item.img}'], true, NOW(), NOW())
                ON CONFLICT DO NOTHING;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback strategy would be to delete items by vendor ID or category codes
    }
}
