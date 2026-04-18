import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const isDevelopment = process.env.NODE_ENV !== 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || process.env.DB_NAME || 'healthcare',
  entities: isDevelopment ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  migrations: isDevelopment ? ['src/migrations/*.ts'] : ['dist/migrations/*.js'],
  ssl: (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
  synchronize: false, // Always use migrations for safety
  logging: isDevelopment || process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 