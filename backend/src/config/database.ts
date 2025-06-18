import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || undefined,
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Test database connection
pool.on('connect', () => {
    console.log('Successfully Connected to bkaifek PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error happened:', err);
    process.exit(-1);
});

export default pool;
