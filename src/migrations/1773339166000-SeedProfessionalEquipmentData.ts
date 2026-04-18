import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedProfessionalEquipmentData1773339166000 implements MigrationInterface {
    name = 'SeedProfessionalEquipmentData1773339166000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Seed professional categories
        await queryRunner.query(`
            INSERT INTO "equipment_categories" ("id", "name", "category_code", "description", "is_active", "sort_order")
            VALUES 
            (uuid_generate_v4(), 'Diagnostic Imaging', 'DIAG_IMG', 'MRI, CT, X-ray, Ultrasound and other imaging systems', true, 1),
            (uuid_generate_v4(), 'Life Support & Critical Care', 'LIFE_SUP', 'Ventilators, Defibrillators, and ICU monitoring', true, 2),
            (uuid_generate_v4(), 'Surgical Equipment', 'SURG_EQ', 'Surgical lasers, robotics, and operating room systems', true, 3),
            (uuid_generate_v4(), 'Laboratory Diagnostics', 'LAB_DIAG', 'Hematology, Biochemistry analyzers and lab automation', true, 4),
            (uuid_generate_v4(), 'Patient Monitoring', 'PAT_MON', 'Multiparameter monitors, telemetry and wearable healthcare', true, 5),
            (uuid_generate_v4(), 'Rehabilitation & Physiotherapy', 'REHAB', 'Physical therapy and recovery equipment', true, 6),
            (uuid_generate_v4(), 'Dental Systems', 'DENTAL', 'Dental chairs, imaging and surgical tools', true, 7),
            (uuid_generate_v4(), 'Ophthalmic Systems', 'OPHTHAL', 'Eye surgery and vision testing equipment', true, 8)
            ON CONFLICT ("category_code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description";
        `);

        // Seed international vendors
        await queryRunner.query(`
            INSERT INTO "equipment_vendors" ("id", "company_name", "email", "phone", "verification_status", "rating_average", "total_ratings", "is_active", "description")
            VALUES 
            (uuid_generate_v4(), 'GE HealthCare', 'info@gehealthcare.com', '+1-800-437-1171', 'verified', 4.9, 1250, true, 'Global leader in medical imaging, monitoring, and digital solutions'),
            (uuid_generate_v4(), 'Siemens Healthineers', 'contact@healthineers.com', '+49-9131-84-0', 'verified', 4.8, 1100, true, 'Precision medicine and digital health solutions provider'),
            (uuid_generate_v4(), 'Philips Healthcare', 'support@philips.com', '+31-20-59-77777', 'verified', 4.7, 950, true, 'Innovation in diagnostic imaging and image-guided therapy'),
            (uuid_generate_v4(), 'Medtronic', 'corporate@medtronic.com', '+1-763-514-4000', 'verified', 4.8, 1400, true, 'Global leader in medical technology, services, and solutions'),
            (uuid_generate_v4(), 'Stryker', 'info@stryker.com', '+1-269-385-2600', 'verified', 4.6, 800, true, 'Specializing in orthopaedics, medical and surgical, and neurotechnology'),
            (uuid_generate_v4(), 'Roche Diagnostics', 'diagnostics@roche.com', '+41-61-688-11-11', 'verified', 4.9, 700, true, 'World leader in in-vitro diagnostics and tissue-based cancer diagnostics')
            ON CONFLICT ("email") DO NOTHING;
        `);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // We don't necessarily want to delete data on rollback if it might be used by equipment items
        // But for consistency we could delete based on codes/emails
    }
}
