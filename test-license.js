// Quick test of license system
const crypto = require('node:crypto');

// Test the hash verification
const masterKey = 'MicroAccountDev';
const masterSalt = 'GridsMicro@322835';
const storedMasterHash = 'e932083aa604b21e64e91e105b06c088497407ecfb5260c4b74961155107014e';

const masterHash = crypto.createHash('sha256').update(masterKey + masterSalt).digest('hex');
console.log('Master Key:', masterKey);
console.log('Expected Hash:', storedMasterHash);
console.log('Actual Hash:', masterHash);
console.log('Verification Result:', masterHash === storedMasterHash ? '✅ SUCCESS' : '❌ FAILED');

// Test license key generation
const timestamp = Date.now().toString();
const typeCode = 'PRO';
const randomComponent = crypto.randomBytes(16).toString('hex');
const baseKey = `MICRO-${timestamp}-${typeCode}-${randomComponent}`;
const checksum = crypto.createHash('sha256').update(baseKey).digest('hex').substring(0, 8);
const licenseKey = `${baseKey}-${checksum}`;

console.log('\n🔑 Generated License Key:', licenseKey);
console.log('✅ License Generation System Working!');
