-- =======================================================
-- AI AUDITOR - ai_alerts table
-- Storage for proactive AI accounting audit findings
-- =======================================================
CREATE TABLE IF NOT EXISTS ai_alerts (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(10) NOT NULL DEFAULT 'info',   -- critical | warning | info
    category VARCHAR(50) NOT NULL,                    -- invoice | vat | wht | cashflow | tax_deadline | journal | expense | profit
    title TEXT NOT NULL,
    detail TEXT,
    recommendation TEXT,
    reference_id INTEGER,                             -- e.g. invoice_id, expense_id
    reference_label VARCHAR(50),                      -- e.g. INV-001
    status VARCHAR(20) NOT NULL DEFAULT 'open',       -- open | resolved | dismissed
    dedup_key VARCHAR(150),                           -- unique key to prevent duplicate alerts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_alerts_status ON ai_alerts(status);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_dedup ON ai_alerts(dedup_key);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON ai_alerts(severity);
