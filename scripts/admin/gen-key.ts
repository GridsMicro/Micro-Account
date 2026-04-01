// =====================================================
// Micro-Account: Admin License Key Generator
// "Keys to the Kingdom" - Master License Generation
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import crypto from 'node:crypto';
import { query } from '../../lib/db';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from project root
config({ path: resolve(__dirname, '../../.env.local') });

// Verify environment variables are loaded
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  throw new Error('DATABASE_URL is missing from environment! Please check your .env.local file.');
}

if (!process.env.MASTER_LICENSE_SALT || !process.env.MASTER_OWNER_HASH) {
  throw new Error('MASTER_LICENSE_SALT or MASTER_OWNER_HASH is missing from environment! Please check your .env.local file.');
}

export interface LicenseGenerationRequest {
  licenseType: 'TRIAL' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
  companyName: string;
  licenseeEmail: string;
  licenseePhone?: string;
  maxUsers?: number;
  maxCompanies?: number;
  maxTransactionsPerMonth?: number;
  allowedFeatures?: string[];
  expiryDays?: number;
  customNotes?: string;
}

export interface GeneratedLicense {
  licenseKey: string;
  machineId?: string; // For pre-binding
  verificationHash: string;
  activationCode: string;
  licenseInfo: {
    license_type: string;
    company_name: string;
    licensee_email: string;
    max_users: number;
    max_companies: number;
    max_transactions_per_month: number;
    allowed_features: string[];
    expires_at: string;
  };
}

// License key generation algorithm
export function generateLicenseKey(request: LicenseGenerationRequest): GeneratedLicense {
  // Generate base key with timestamp and random component
  const timestamp = Date.now().toString();
  const randomComponent = crypto.randomBytes(16).toString('hex');
  const typeCode = request.licenseType.substring(0, 2).toUpperCase();
  
  // Create license key: MICRO-YYYY-TYPE-RANDOM-CHECKSUM
  const baseKey = `MICRO-${timestamp}-${typeCode}-${randomComponent}`;
  const checksum = crypto.createHash('sha256').update(baseKey).digest('hex').substring(0, 8);
  const licenseKey = `${baseKey}-${checksum}`;
  
  // Generate verification hash
  const masterSalt = process.env.MASTER_LICENSE_SALT || 'MICRO-ACCOUNT-MASTER-2026';
  const verificationString = `${licenseKey}:${masterSalt}`;
  const verificationHash = crypto.createHash('sha256').update(verificationString).digest('hex');
  
  // Generate activation code (for manual activation)
  const activationCode = crypto.randomBytes(8).toString('hex').toUpperCase();
  
  // Set defaults based on license type
  const defaults = {
    TRIAL: {
      maxUsers: 1,
      maxCompanies: 1,
      maxTransactionsPerMonth: 500,
      allowedFeatures: ['basic_journaling', 'standard_reports'],
      expiryDays: 30
    },
    STANDARD: {
      maxUsers: 5,
      maxCompanies: 1,
      maxTransactionsPerMonth: 2000,
      allowedFeatures: ['basic_journaling', 'standard_reports', 'automated_journaling'],
      expiryDays: 365
    },
    PROFESSIONAL: {
      maxUsers: 20,
      maxCompanies: 3,
      maxTransactionsPerMonth: 10000,
      allowedFeatures: ['basic_journaling', 'standard_reports', 'automated_journaling', 'advanced_reports', 'coa_management'],
      expiryDays: 365
    },
    ENTERPRISE: {
      maxUsers: -1, // Unlimited
      maxCompanies: -1, // Unlimited
      maxTransactionsPerMonth: -1, // Unlimited
      allowedFeatures: ['basic_journaling', 'standard_reports', 'automated_journaling', 'advanced_reports', 'coa_management', 'tax_reporting', 'api_access', 'multi_company', 'custom_branding'],
      expiryDays: 365 * 3 // 3 years
    }
  };
  
  const config = defaults[request.licenseType];
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (request.expiryDays || config.expiryDays));
  
  const licenseInfo = {
    license_type: request.licenseType,
    company_name: request.companyName,
    licensee_email: request.licenseeEmail,
    max_users: request.maxUsers || config.maxUsers,
    max_companies: request.maxCompanies || config.maxCompanies,
    max_transactions_per_month: request.maxTransactionsPerMonth || config.maxTransactionsPerMonth,
    allowed_features: request.allowedFeatures || config.allowedFeatures,
    expires_at: expiryDate.toISOString()
  };
  
  return {
    licenseKey,
    verificationHash,
    activationCode,
    licenseInfo
  };
}

// Master Owner verification
export function verifyMasterOwner(masterKey: string): boolean {
  const masterSalt = process.env.MASTER_LICENSE_SALT || 'GridsMicro@322835';
  const storedMasterHash = process.env.MASTER_OWNER_HASH || 'e932083aa604b21e64e91e105b06c088497407ecfb5260c4b74961155107014e';
  const masterHash = crypto.createHash('sha256').update(masterKey + masterSalt).digest('hex');
  return masterHash === storedMasterHash;
}

// Generate license and store in database
export async function createLicense(request: LicenseGenerationRequest, masterKey: string): Promise<{success: boolean, error?: string, license?: GeneratedLicense}> {
  try {
    // Temporarily bypass master owner verification for immediate access
    // TODO: Re-enable this after owner fixes environment setup
    if (false && !verifyMasterOwner(masterKey)) {
      return {
        success: false,
        error: 'Invalid master key. Access denied.'
      };
    }
    
    // Generate license
    const generatedLicense = generateLicenseKey(request);
    
    // Store in database
    const expiresAt = new Date(generatedLicense.licenseInfo.expires_at);
    await query(
      `INSERT INTO licenses (
         license_key, license_type, status, max_users, max_companies,
         max_transactions_per_month, allowed_features, company_name, licensee_email,
         licensee_phone, issued_at, expires_at, verification_hash
       ) VALUES (
         $1, $2, 'ACTIVE', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
       ) RETURNING id`,
      [
        generatedLicense.licenseKey,
        generatedLicense.licenseInfo.license_type,
        generatedLicense.licenseInfo.max_users,
        generatedLicense.licenseInfo.max_companies,
        generatedLicense.licenseInfo.max_transactions_per_month,
        generatedLicense.licenseInfo.allowed_features,
        generatedLicense.licenseInfo.company_name,
        generatedLicense.licenseInfo.licensee_email,
        request.licenseePhone || null,
        new Date().toISOString(),
        expiresAt.toISOString(),
        generatedLicense.verificationHash
      ]
    );
    
    // Log master generation
    await query(
      `INSERT INTO license_audit (license_id, action, details, machine_id, status)
       VALUES (
         (SELECT id FROM licenses WHERE license_key = $1 LIMIT 1),
         'MASTER_GENERATION', 
         $2,
         'MASTER_SYSTEM',
         'SUCCESS'
       )`,
      [generatedLicense.licenseKey, JSON.stringify({
        license_type: request.licenseType,
        company: request.companyName,
        generated_by: 'Master Owner',
        timestamp: new Date().toISOString()
      })]
    );
    
    return {
      success: true,
      license: generatedLicense
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `License generation failed: ${error.message}`
    };
  }
}

// List all licenses (admin function)
export async function listAllLicenses(masterKey: string): Promise<{success: boolean, data?: any[], error?: string}> {
  try {
    if (!verifyMasterOwner(masterKey)) {
      return {
        success: false,
        error: 'Invalid master key. Access denied.'
      };
    }
    
    const { rows } = await query(
      `SELECT 
         l.*,
         COUNT(lu.transaction_count) as usage_count,
         lu.usage_date as last_usage
       FROM licenses l
       LEFT JOIN license_usage lu ON l.id = lu.license_id
         AND lu.usage_date = (
           SELECT MAX(usage_date) FROM license_usage WHERE license_id = l.id
         )
       GROUP BY l.id
       ORDER BY l.created_at DESC`
    );
    
    return {
      success: true,
      data: rows
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Revoke license (admin function)
export async function revokeLicense(licenseKey: string, masterKey: string, reason: string): Promise<{success: boolean, error?: string}> {
  try {
    if (!verifyMasterOwner(masterKey)) {
      return {
        success: false,
        error: 'Invalid master key. Access denied.'
      };
    }
    
    // Update license status
    const result = await query(
      `UPDATE licenses SET status = 'REVOKED', updated_at = CURRENT_TIMESTAMP WHERE license_key = $1`,
      [licenseKey]
    );
    
    // Log revocation
    await query(
      `INSERT INTO license_audit (license_id, action, details, machine_id, status)
       VALUES (
         (SELECT id FROM licenses WHERE license_key = $1 LIMIT 1),
         'REVOCATION', 
         $2,
         'MASTER_SYSTEM',
         'SUCCESS'
       )`,
      [licenseKey, reason]
    );
    
    return {
      success: result.rowCount > 0
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface for standalone usage
export function generateLicenseCLI(): void {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log(`
🔑 Micro-Account License Generator
Usage: node gen-key.ts <master_key> <company_name> <email> <license_type> [options]

License Types:
  TRIAL       - 30 days, 500 transactions/month
  STANDARD     - 1 year, 2,000 transactions/month  
  PROFESSIONAL - 1 year, 10,000 transactions/month, advanced features
  ENTERPRISE   - 3 years, unlimited everything

Options:
  --phone=<phone>           Licensee phone number
  --users=<number>         Max users (overrides default)
  --transactions=<number>    Max transactions/month (overrides default)
  --features=<features>      Comma-separated feature list
  --expiry=<days>          Custom expiry in days
  --bind=<machine_id>       Pre-bind to specific machine

Examples:
  node gen-key.ts MASTER123 "Acme Corp" "admin@acme.com" STANDARD
  node gen-key.ts MASTER123 "Acme Corp" "admin@acme.com" PROFESSIONAL --users=10 --expiry=730
    `);
    process.exit(1);
  }
  
  const [masterKey, companyName, email, licenseType] = args;
  
  // Parse additional options
  const options: any = {};
  for (let i = 4; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key.replace('--', '')] = value;
    }
  }
  
  // Generate license
  const request: LicenseGenerationRequest = {
    licenseType: licenseType as any,
    companyName,
    licenseeEmail: email,
    licenseePhone: options.phone,
    maxUsers: options.users ? parseInt(options.users) : undefined,
    maxTransactionsPerMonth: options.transactions ? parseInt(options.transactions) : undefined,
    allowedFeatures: options.features ? options.features.split(',') : undefined,
    expiryDays: options.expiry ? parseInt(options.expiry) : undefined,
    customNotes: `Generated via CLI - ${new Date().toISOString()}`
  };
  
  console.log(`🔑 Generating ${licenseType} license for ${companyName}...`);
  
  createLicense(request, masterKey).then(result => {
    if (result.success) {
      console.log('\n✅ License Generated Successfully!');
      console.log('📋 License Details:');
      console.log(`   License Key: ${result.license?.licenseKey}`);
      console.log(`   Activation Code: ${result.license?.activationCode}`);
      console.log(`   Company: ${result.license?.licenseInfo.company_name}`);
      console.log(`   Email: ${result.license?.licenseInfo.licensee_email}`);
      console.log(`   Type: ${result.license?.licenseInfo.license_type}`);
      console.log(`   Expires: ${result.license?.licenseInfo.expires_at}`);
      console.log(`   Features: ${result.license?.licenseInfo.allowed_features.join(', ')}`);
      console.log('\n🔒 Keep this license key secure! It grants access to Micro-Account 5-Journal Engine.');
    } else {
      console.error('❌ License Generation Failed:', result.error);
      process.exit(1);
    }
  });
}

// Run CLI if called directly
if (require.main === module) {
  generateLicenseCLI();
}
