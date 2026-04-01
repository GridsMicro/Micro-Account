// Database Check Script
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 3,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if licenses table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses'
      );
    `);
    
    const tableExists = result.rows[0].exists;
    console.log('📋 Licenses table exists:', tableExists ? 'YES' : 'NO');
    
    if (!tableExists) {
      console.log('🔧 Creating licenses table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS licenses (
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
    
    // Test inserting a license
    console.log('🧪 Testing license insertion...');
    const testLicense = {
      license_key: 'TEST-LICENSE-KEY-123',
      machine_id: 'TEST-MACHINE-ID',
      license_type: 'TRIAL',
      status: 'ACTIVE',
      max_users: 1,
      max_companies: 1,
      max_transactions_per_month: 500,
      allowed_features: ['basic_journaling'],
      verification_hash: 'test-hash',
      company_name: 'Test Company',
      licensee_email: 'test@example.com'
    };
    
    const insertResult = await client.query(`
      INSERT INTO licenses (
        license_key, machine_id, license_type, status, max_users, max_companies,
        max_transactions_per_month, allowed_features, verification_hash, company_name, licensee_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id;
    `, [
      testLicense.license_key,
      testLicense.machine_id,
      testLicense.license_type,
      testLicense.status,
      testLicense.max_users,
      testLicense.max_companies,
      testLicense.max_transactions_per_month,
      testLicense.allowed_features,
      testLicense.verification_hash,
      testLicense.company_name,
      testLicense.licensee_email
    ]);
    
    console.log('✅ License inserted successfully, ID:', insertResult.rows[0].id);
    
    // Clean up test data
    await client.query('DELETE FROM licenses WHERE license_key = $1', ['TEST-LICENSE-KEY-123']);
    console.log('🧹 Test data cleaned up');
    
    await client.release();
    console.log('🚀 Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkDatabase();
