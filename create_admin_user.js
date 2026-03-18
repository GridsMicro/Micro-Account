const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Get configuration from environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@microtronic.biz';
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Administrator';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const SEED_ADMIN_ROLE = process.env.SEED_ADMIN_ROLE || 'Administrator';

// Validate required environment variables
if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('   Please set it in .env.local or as an environment variable');
  process.exit(1);
}

async function createAdminUser() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    console.log('📝 Creating admin user with the following data:');
    console.log(`   Email: ${SEED_ADMIN_EMAIL}`);
    console.log(`   Name: ${SEED_ADMIN_NAME}`);
    console.log(`   Role: ${SEED_ADMIN_ROLE}`);
    console.log(`   Password: ${SEED_ADMIN_PASSWORD.replace(/./g, '•')}`);

    // Hash password using bcryptjs
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [SEED_ADMIN_EMAIL]
    );

    if (existingUser.rows.length > 0) {
      console.log(`\n⚠️  User with email ${SEED_ADMIN_EMAIL} already exists!`);
      console.log(`   ID: ${existingUser.rows[0].id}`);
      console.log('   No action taken.');
      client.release();
      await pool.end();
      return;
    }

    // Create admin user
    console.log('\n📊 Inserting user into database...');
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
       RETURNING id, email, name, role, status, created_at`,
      [SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, hashedPassword, SEED_ADMIN_ROLE, 'Active']
    );

    const user = result.rows[0];
    console.log('\n✅ Admin user created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Created:', user.created_at);
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Change the password after first login');
    console.log('   2. Remove SEED_ADMIN_PASSWORD from .env.local after setup');
    console.log('   3. Never commit seed credentials to version control');
    
    client.release();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUser();
