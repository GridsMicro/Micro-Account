import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    // Hash password
    const password = 'admin123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@microtronic.biz']
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ User admin@microtronic.biz already exists');
      client.release();
      await pool.end();
      return;
    }

    // Create test admin user
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role`,
      ['Administrator', 'admin@microtronic.biz', hashedPassword, 'Administrator', 'Active']
    );

    console.log('✅ Test admin user created:');
    console.log('   Email:', result.rows[0].email);
    console.log('   Name:', result.rows[0].name);
    console.log('   Role:', result.rows[0].role);
    console.log('   Password: admin123');
    console.log('\n⚠️ IMPORTANT: Change the password after first login!');
    
    client.release();
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await pool.end();
  }
}

createTestUser();
