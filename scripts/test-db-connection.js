// Test Database Connection
require('dotenv').config({ path: '../.env.local' });
const { Pool } = require('pg');

async function testDB() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📋 Database URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      console.log('❌ Database URL not found in environment');
      console.log('💡 Please check your .env.local file contains POSTGRES_URL or DATABASE_URL');
      return;
    }
    
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
    
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Database query successful:', result.rows[0].current_time);
    
    // Check if licenses table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('📋 Licenses table exists:', tableExists ? 'YES' : 'NO');
    
    if (!tableExists) {
      console.log('🔧 Creating licenses table...');
      await client.query(`
        CREATE TABLE licenses (
          id SERIAL PRIMARY KEY,
          license_key VARCHAR(64) UNIQUE NOT NULL,
          machine_id VARCHAR(128) NOT NULL,
          license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('TRIAL', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE')),
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
          max_users INTEGER DEFAULT 1,
          max_companies INTEGER DEFAULT 1,
          max_transactions_per_month INTEGER DEFAULT 1000,
          allowed_features TEXT[],
          verification_hash VARCHAR(128),
          activation_ip INET,
          hardware_fingerprint TEXT,
          audit_log JSONB DEFAULT '[]'::jsonb,
          company_name VARCHAR(255),
          licensee_email VARCHAR(255),
          licensee_phone VARCHAR(50),
          issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE,
          last_verified_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT licenses_machine_license_unique UNIQUE (machine_id, license_key),
          CONSTRAINT licenses_valid_dates CHECK (expires_at IS NULL OR expires_at > issued_at)
        );
      `);
      console.log('✅ Licenses table created successfully');
    }
    
    await client.release();
    console.log('🚀 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDB();
