// =====================================================
// Micro-Account: Copyright Header Application
// Applies standard copyright headers to all core files
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

const fs = require('fs');
const path = require('path');

const COPYRIGHT_HEADER = `// =====================================================
// Micro-Account: 5-Journal Engine Component
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// Unauthorized duplication, distribution, or reverse engineering strictly prohibited.
// =====================================================

`;

const TS_COPYRIGHT_HEADER = `// =====================================================
// Micro-Account: 5-Journal Engine Component
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// Unauthorized duplication, distribution, or reverse engineering strictly prohibited.
// =====================================================

`;

const SQL_COPYRIGHT_HEADER = `-- =====================================================
-- Micro-Account: Database Schema
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- Unauthorized duplication, distribution, or reverse engineering strictly prohibited.
-- =====================================================

`;

// Core files to protect with copyright
const CORE_FILES = [
  // Library files
  'lib/journaling.ts',
  'lib/license-check.ts',
  'lib/db.ts',
  'lib/tax.ts',
  'lib/contacts.ts',
  'lib/rd-api.ts',
  
  // Action files
  'app/actions.ts',
  'app/expense-actions.ts',
  
  // Core components
  'components/Sidebar.tsx',
  
  // Database scripts
  'scripts/init-chart-of-accounts.sql',
  'scripts/upgrade-products-table.sql',
  'scripts/create-licensing-table.sql'
];

const FRONTEND_FILES = [
  // React components
  'app/inventory/new/page.tsx',
  'app/receipts/page.tsx',
  'app/accounting/reconciliation/page.tsx',
  'app/expenses/page.tsx'
];

const SQL_FILES = [
  'scripts/init-chart-of-accounts.sql',
  'scripts/upgrade-products-table.sql',
  'scripts/create-licensing-table.sql'
];

function applyCopyright(filePath, header) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if copyright already exists
      if (content.includes('Copyright (c) 2026 Micro-Account')) {
        console.log(`✅ Copyright already exists: ${filePath}`);
        return;
      }
      
      // Add copyright header
      const newContent = header + '\n\n' + content;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`📝 Applied copyright to: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to apply copyright to ${filePath}:`, error.message);
  }
}

// Apply copyright to TypeScript/JavaScript files
CORE_FILES.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  applyCopyright(filePath, TS_COPYRIGHT_HEADER);
});

// Apply copyright to frontend files
FRONTEND_FILES.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  applyCopyright(filePath, TS_COPYRIGHT_HEADER);
});

// Apply copyright to SQL files
SQL_FILES.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  applyCopyright(filePath, SQL_COPYRIGHT_HEADER);
});

console.log('\n🛡️ Copyright protection applied to Micro-Account 5-Journal Engine');
console.log('📊 Total files protected:', CORE_FILES.length + FRONTEND_FILES.length + SQL_FILES.length);
console.log('⚠️  Unauthorized duplication strictly prohibited');
console.log('🔒 IP protection enabled');
