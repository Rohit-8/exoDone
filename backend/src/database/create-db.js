import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

async function createDatabase() {
  // Connect to postgres default database first
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Check if database exists
    const dbName = process.env.DB_NAME || 'interview_prep';
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${dbName}' already exists`);
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error);
    await client.end();
    process.exit(1);
  }
}

createDatabase();
