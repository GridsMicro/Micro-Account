// Test Environment Loading
require('dotenv').config({ path: '../.env.local' });

console.log('🔍 Testing Environment Loading...');
console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('📋 MASTER_LICENSE_SALT:', process.env.MASTER_LICENSE_SALT ? 'SET' : 'NOT SET');
console.log('📋 MASTER_OWNER_HASH:', process.env.MASTER_OWNER_HASH ? 'SET' : 'NOT SET');

if (process.env.DATABASE_URL && process.env.MASTER_LICENSE_SALT && process.env.MASTER_OWNER_HASH) {
  console.log('✅ Environment variables loaded successfully!');
  console.log('🚀 Ready to test license generation...');
} else {
  console.log('❌ Environment variables missing!');
  console.log('💡 Check .env.local file contains all required variables');
}
