const bcrypt = require('bcryptjs');

const password = 'Tester1234';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('Hashed password:');
  console.log(hash);
  
  // Also generate SQL
  console.log('\nSQL for user insertion:');
  console.log(`INSERT INTO users (name, email, password, role, status, created_at) VALUES ('Test User', 'k.net.game01@gmail.com', '${hash}', 'superadmin', 'active', CURRENT_TIMESTAMP);`);
});
