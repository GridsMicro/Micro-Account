// =====================================================
// Micro-Account: License Verification Middleware
// Protects the unique 5-Journal Engine IP
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';

// License Types & Features
export type LicenseType = 'TRIAL' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

export interface LicenseInfo {
  id: number;
  license_key: string;
  machine_id: string;
  license_type: LicenseType;
  status: LicenseStatus;
  max_users: number;
  max_companies: number;
  max_transactions_per_month: number;
  allowed_features: string[];
  expires_at?: string;
  company_name: string;
  licensee_email: string;
  verification_hash?: string;
}

export interface LicenseCheckResult {
  valid: boolean;
  license?: LicenseInfo;
  error?: string;
  action?: 'ALLOW' | 'DENY' | 'LIMIT_REACHED' | 'EXPIRED' | 'SUSPENDED';
}

// Hardware fingerprinting
export function generateMachineFingerprint(): string {
  const os = require('node:os');
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();
  
  // Create unique fingerprint from hardware components
  const components = [
    cpus[0]?.model || 'unknown',
    os.totalmem() || 0,
    os.hostname() || 'unknown',
    Object.keys(networkInterfaces)[0] || 'unknown'
  ];
  
  const fingerprint = components.join('|');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

// License verification hash
export function createVerificationHash(licenseKey: string, machineId: string): string {
  const salt = process.env.LICENSE_SALT || 'MICRO-ACCOUNT-2026-SALT';
  const combined = `${licenseKey}:${machineId}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// Core license verification
export async function verifyLicense(licenseKey: string, machineId: string): Promise<LicenseCheckResult> {
  try {
    // Check database for valid license
    const { rows } = await query(
      `SELECT * FROM licenses 
       WHERE license_key = $1 AND machine_id = $2 AND status = 'ACTIVE'
       ORDER BY created_at DESC LIMIT 1`,
      [licenseKey, machineId]
    );
    
    if (rows.length === 0) {
      await logLicenseActivity(licenseKey, machineId, 'VERIFICATION_FAILED', 'No valid license found');
      return {
        valid: false,
        error: 'Invalid or inactive license key',
        action: 'DENY'
      };
    }
    
    const license = rows[0] as LicenseInfo;
    
    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await updateLicenseStatus(license.id, 'EXPIRED');
      await logLicenseActivity(licenseKey, machineId, 'EXPIRY', `License expired on ${license.expires_at}`);
      return {
        valid: false,
        error: 'License has expired',
        action: 'EXPIRED'
      };
    }
    
    // Verify hash to prevent tampering
    const expectedHash = createVerificationHash(licenseKey, machineId);
    if (license.verification_hash && license.verification_hash !== expectedHash) {
      await logLicenseActivity(licenseKey, machineId, 'TAMPER_DETECTED', 'License hash mismatch');
      return {
        valid: false,
        error: 'License verification failed - possible tampering',
        action: 'DENY'
      };
    }
    
    // Update last verification timestamp
    await query(
      'UPDATE licenses SET last_verified_at = CURRENT_TIMESTAMP WHERE id = $1',
      [license.id]
    );
    
    await logLicenseActivity(licenseKey, machineId, 'VERIFICATION_SUCCESS', 'License verified successfully');
    
    return {
      valid: true,
      license,
      action: 'ALLOW'
    };
    
  } catch (error: unknown) {
    console.error('License verification error:', error);
    return {
      valid: false,
      error: 'License verification system error',
      action: 'DENY'
    };
  }
}

// Feature access checking
export async function checkFeatureAccess(
  licenseKey: string, 
  machineId: string, 
  feature: string
): Promise<LicenseCheckResult> {
  const licenseCheck = await verifyLicense(licenseKey, machineId);
  
  if (!licenseCheck.valid || !licenseCheck.license) {
    return licenseCheck;
  }
  
  const license = licenseCheck.license;
  
  // Check if feature is allowed
  if (!license.allowed_features.includes(feature)) {
    await logLicenseActivity(licenseKey, machineId, 'FEATURE_DENIED', `Feature ${feature} not allowed`);
    return {
      valid: false,
      error: `Feature '${feature}' not available in ${license.license_type} license`,
      action: 'DENY'
    };
  }
  
  // Check usage limits for critical features
  if (feature === 'journal_engine') {
    const usageCheck = await checkUsageLimits(license.id, license.max_transactions_per_month);
    if (!usageCheck.withinLimit) {
      return {
        valid: false,
        error: `Monthly transaction limit exceeded: ${usageCheck.current}/${usageCheck.limit}`,
        action: 'LIMIT_REACHED'
      };
    }
  }
  
  return {
    valid: true,
    license,
    action: 'ALLOW'
  };
}

// Usage limit checking
async function checkUsageLimits(licenseId: number, maxTransactions: number): Promise<{withinLimit: boolean, current: number, limit: number}> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { rows } = await query(
    `SELECT COALESCE(SUM(transaction_count), 0) as total 
     FROM license_usage 
     WHERE license_id = $1 AND usage_date >= $2::date`,
    [licenseId, currentMonth]
  );
  
  const currentUsage = parseInt(rows[0]?.total || '0');
  
  return {
    withinLimit: currentUsage < maxTransactions,
    current: currentUsage,
    limit: maxTransactions
  };
}

// Update license status
async function updateLicenseStatus(licenseId: number, status: LicenseStatus): Promise<void> {
  await query(
    'UPDATE licenses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, licenseId]
  );
}

// Log license activities
async function logLicenseActivity(
  licenseKey: string, 
  machineId: string, 
  action: string, 
  details: string
): Promise<void> {
  await query(
    `INSERT INTO license_audit (license_id, action, details, machine_id, ip_address, user_agent, status)
     VALUES (
       (SELECT id FROM licenses WHERE license_key = $1 LIMIT 1),
       $2, $3, $4, $5, $6, 'SUCCESS'
     )`,
    [licenseKey, action, details, machineId, null, null]
  );
}

// Middleware for Next.js API routes
export function withLicenseCheck(feature: string = 'basic_access') {
  return async function middleware(request: NextRequest) {
    // Get license info from headers or environment
    const licenseKey = request.headers.get('x-license-key') || process.env.MICRO_ACCOUNT_LICENSE;
    const machineId = request.headers.get('x-machine-id') || generateMachineFingerprint();
    
    if (!licenseKey) {
      return NextResponse.json({
        error: 'License key required',
        action: 'DENY'
      }, { status: 401 });
    }
    
    // Check license and feature access
    const licenseCheck = await checkFeatureAccess(licenseKey, machineId, feature);
    
    if (!licenseCheck.valid) {
      return NextResponse.json({
        error: licenseCheck.error,
        action: licenseCheck.action,
        feature
      }, { status: 403 });
    }
    
    // Add license info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-license-valid', 'true');
    response.headers.set('x-license-type', licenseCheck.license?.license_type || 'UNKNOWN');
    response.headers.set('x-license-features', JSON.stringify(licenseCheck.license?.allowed_features || []));
    
    return response;
  };
}

// Protect critical 5-Journal Engine functions
export const PROTECTED_FEATURES = {
  JOURNAL_ENGINE: 'journal_engine',
  ADVANCED_REPORTS: 'advanced_reports', 
  MULTI_COMPANY: 'multi_company',
  API_ACCESS: 'api_access',
  CUSTOM_BRANDING: 'custom_branding',
  AUTOMATED_JOURNALING: 'automated_journaling',
  COA_MANAGEMENT: 'coa_management',
  TAX_REPORTING: 'tax_reporting'
} as const;

// License activation
export async function activateLicense(
  licenseKey: string, 
  machineId: string, 
  companyInfo: {name: string, email: string, phone?: string}
): Promise<LicenseCheckResult> {
  try {
    // Check if license exists and is valid for activation
    const { rows } = await query(
      `SELECT * FROM licenses WHERE license_key = $1 AND status IN ('ACTIVE', 'SUSPENDED')`,
      [licenseKey]
    );
    
    if (rows.length === 0) {
      return {
        valid: false,
        error: 'Invalid license key for activation',
        action: 'DENY'
      };
    }
    
    const license = rows[0] as LicenseInfo;
    
    // Create verification hash
    const verificationHash = createVerificationHash(licenseKey, machineId);
    
    // Update license with machine binding
    await query(
      `UPDATE licenses SET 
         machine_id = $1, 
         verification_hash = $2,
         status = 'ACTIVE',
         company_name = $3,
         licensee_email = $4,
         licensee_phone = $5,
         last_verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        machineId, 
        verificationHash, 
        companyInfo.name, 
        companyInfo.email, 
        companyInfo.phone || null,
        license.id
      ]
    );
    
    await logLicenseActivity(licenseKey, machineId, 'ACTIVATION', `License activated for ${companyInfo.name}`);
    
    return {
      valid: true,
      license: { ...license, machine_id: machineId, company_name: companyInfo.name },
      action: 'ALLOW'
    };
    
  } catch (error: unknown) {
    return {
      valid: false,
      error: 'License activation failed: ' + (error as Error).message,
      action: 'DENY'
    };
  }
}
