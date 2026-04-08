-- =====================================================
-- Audit: accounts -> chart_of_accounts consolidation
-- Safe read-only checks for Neon SQL Editor
-- =====================================================

-- 1. Summary counts
SELECT 'accounts' AS source, COUNT(*) AS total_rows FROM accounts
UNION ALL
SELECT 'chart_of_accounts' AS source, COUNT(*) AS total_rows FROM chart_of_accounts;

-- 2. Duplicate codes inside legacy accounts
SELECT code, COUNT(*) AS duplicate_count
FROM accounts
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY code;

-- 3. Duplicate codes inside chart_of_accounts
SELECT account_code, COUNT(*) AS duplicate_count
FROM chart_of_accounts
GROUP BY account_code
HAVING COUNT(*) > 1
ORDER BY account_code;

-- 4. Legacy accounts missing from chart_of_accounts
SELECT
  a.id AS accounts_id,
  a.code,
  a.name AS accounts_name,
  a.category AS accounts_category,
  a.description
FROM accounts a
LEFT JOIN chart_of_accounts coa
  ON coa.account_code::text = a.code::text
WHERE coa.id IS NULL
ORDER BY a.code;

-- 5. chart_of_accounts rows missing from legacy accounts
SELECT
  coa.id AS coa_id,
  coa.account_code,
  COALESCE(coa.account_name_th, coa.account_name_en) AS coa_name,
  coa.account_type,
  coa.account_category
FROM chart_of_accounts coa
LEFT JOIN accounts a
  ON a.code::text = coa.account_code::text
WHERE a.id IS NULL
ORDER BY coa.account_code;

-- 6. Same code but name/category mismatch
SELECT
  a.code,
  a.name AS accounts_name,
  COALESCE(coa.account_name_th, coa.account_name_en) AS coa_name,
  a.category AS accounts_category,
  coa.account_type,
  coa.account_category
FROM accounts a
JOIN chart_of_accounts coa
  ON coa.account_code::text = a.code::text
WHERE LOWER(COALESCE(a.name, '')) <> LOWER(COALESCE(coa.account_name_th, coa.account_name_en, ''))
   OR LOWER(COALESCE(a.category, '')) <> LOWER(COALESCE(coa.account_type, ''))
ORDER BY a.code;

-- 7. Journal rows still tied to legacy account_name only
SELECT
  COUNT(*) AS legacy_only_journal_rows
FROM journal_entries
WHERE account_name IS NOT NULL
  AND (debit_account_id IS NULL OR credit_account_id IS NULL);

-- 8. Which legacy journal account names still need mapping
SELECT
  account_name,
  COUNT(*) AS row_count
FROM journal_entries
WHERE account_name IS NOT NULL
  AND (debit_account_id IS NULL OR credit_account_id IS NULL)
GROUP BY account_name
ORDER BY row_count DESC, account_name ASC;

-- 9. Suggested insert check for service payable
SELECT *
FROM chart_of_accounts
WHERE account_code::text IN ('2103');
