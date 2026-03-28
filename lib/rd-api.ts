// RD API Portal Integration for Thailand Revenue Department
// Handles automated submission of tax documents (e-Tax Invoices, Withholding Tax)

import { query } from "@/lib/db";

interface RDAuthConfig {
  clientId: string;
  clientSecret: string;
  apiKey?: string;
  baseUrl: string;
}

interface RDSubmissionResult {
  success: boolean;
  submissionId?: string;
  status?: string;
  error?: string;
  details?: any;
}

class RDAPIClient {
  private config: RDAuthConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: RDAuthConfig) {
    this.config = config;
  }

  // Authenticate with RD API Portal
  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'tax_submission'
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
    } catch (error: any) {
      throw new Error(`RD API Authentication failed: ${error.message}`);
    }
  }

  // Ensure we have a valid token
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  // Submit e-Tax Invoice (ภ.พ. 30)
  async submitETaxInvoice(invoiceData: {
    taxId: string;
    branchCode: string;
    invoiceNumber: string;
    invoiceDate: string;
    customerTaxId: string;
    customerName: string;
    amount: number;
    vatAmount: number;
    totalAmount: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  }): Promise<RDSubmissionResult> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        taxpayerId: invoiceData.taxId,
        branchCode: invoiceData.branchCode,
        documentType: "TAX_INVOICE",
        documentNumber: invoiceData.invoiceNumber,
        documentDate: invoiceData.invoiceDate,
        buyerTaxId: invoiceData.customerTaxId,
        buyerName: invoiceData.customerName,
        totalAmount: invoiceData.totalAmount,
        vatAmount: invoiceData.vatAmount,
        netAmount: invoiceData.amount,
        items: invoiceData.items
      };

      const response = await fetch(`${this.config.baseUrl}/api/v1/tax-documents/etax-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.config.apiKey || ''
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          submissionId: result.submissionId,
          status: result.status,
          details: result
        };
      } else {
        return {
          success: false,
          error: result.message || `Submission failed: ${response.status}`,
          details: result
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  }

  // Submit Withholding Tax (ภ.ง.ด. 53)
  async submitWithholdingTax(whtData: {
    taxId: string;
    recipientTaxId: string;
    recipientName: string;
    paymentDate: string;
    incomeType: string;
    taxRate: number;
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
    description: string;
  }): Promise<RDSubmissionResult> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        taxpayerId: whtData.taxId,
        recipientTaxId: whtData.recipientTaxId,
        recipientName: whtData.recipientName,
        paymentDate: whtData.paymentDate,
        incomeType: whtData.incomeType,
        taxRate: whtData.taxRate,
        grossAmount: whtData.grossAmount,
        taxWithheld: whtData.taxAmount,
        netAmount: whtData.netAmount,
        description: whtData.description
      };

      const response = await fetch(`${this.config.baseUrl}/api/v1/tax-documents/withholding-tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.config.apiKey || ''
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          submissionId: result.submissionId,
          status: result.status,
          details: result
        };
      } else {
        return {
          success: false,
          error: result.message || `Submission failed: ${response.status}`,
          details: result
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  }

  // Check submission status
  async checkSubmissionStatus(submissionId: string): Promise<RDSubmissionResult> {
    try {
      await this.ensureAuthenticated();

      const response = await fetch(`${this.config.baseUrl}/api/v1/submissions/${submissionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.config.apiKey || ''
        }
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: result.status,
          details: result
        };
      } else {
        return {
          success: false,
          error: result.message || `Status check failed: ${response.status}`,
          details: result
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  }
}

// Global RD API Client instance
let rdClient: RDAPIClient | null = null;

// Initialize RD API Client
export function initializeRDClient(config: RDAuthConfig): void {
  rdClient = new RDAPIClient(config);
}

// Submit e-Tax Invoice from invoice data
export async function submitInvoiceToRD(invoiceId: string): Promise<RDSubmissionResult> {
  if (!rdClient) {
    return { success: false, error: "RD API client not initialized" };
  }

  try {
    // Get invoice data from database
    const invoiceRes = await query(`
      SELECT i.*, c.name as customer_name, c.tax_id as customer_tax_id
      FROM invoices i
      JOIN contacts c ON i.contact_id::text = c.id::text
      WHERE i.id = $1
    `, [invoiceId]);

    if (invoiceRes.rows.length === 0) {
      return { success: false, error: "Invoice not found" };
    }

    const invoice = invoiceRes.rows[0];

    // Get company settings for taxpayer info
    const companyRes = await query("SELECT * FROM company_settings LIMIT 1");
    const company = companyRes.rows[0];

    if (!company?.tax_id) {
      return { success: false, error: "Company tax ID not configured" };
    }

    // Get invoice items (if available)
    const itemsRes = await query(`
      SELECT description, quantity, unit_price, total_price
      FROM invoice_items
      WHERE invoice_id = $1
    `, [invoiceId]);

    const items = itemsRes.rows.map((item: any) => ({
      description: item.description || "Service/Item",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
      amount: Number(item.total_price) || 0
    }));

    // Submit to RD
    const result = await rdClient.submitETaxInvoice({
      taxId: company.tax_id,
      branchCode: "00000", // Main branch
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.created_at || invoice.created_on).toISOString().split('T')[0],
      customerTaxId: invoice.customer_tax_id || "0000000000000",
      customerName: invoice.customer_name,
      amount: Number(invoice.net_amount),
      vatAmount: Number(invoice.vat_amount),
      totalAmount: Number(invoice.net_amount) + Number(invoice.vat_amount),
      items: items
    });

    // Update invoice with submission status
    if (result.success && result.submissionId) {
      await query(`
        UPDATE invoices
        SET rd_submission_id = $1, rd_status = $2, rd_submitted_at = NOW()
        WHERE id = $3
      `, [result.submissionId, result.status, invoiceId]);
    }

    return result;
  } catch (error: any) {
    return { success: false, error: `Database error: ${error.message}` };
  }
}

// Submit Withholding Tax from payment voucher
export async function submitWHTToRD(voucherId: string): Promise<RDSubmissionResult> {
  if (!rdClient) {
    return { success: false, error: "RD API client not initialized" };
  }

  try {
    // Get voucher data
    const voucherRes = await query(`
      SELECT v.*, c.tax_id as recipient_tax_id, c.name as recipient_name
      FROM payment_vouchers v
      LEFT JOIN contacts c ON v.payee_name = c.name
      WHERE v.id = $1
    `, [voucherId]);

    if (voucherRes.rows.length === 0) {
      return { success: false, error: "Payment voucher not found" };
    }

    const voucher = voucherRes.rows[0];

    // Get company settings
    const companyRes = await query("SELECT * FROM company_settings LIMIT 1");
    const company = companyRes.rows[0];

    if (!company?.tax_id) {
      return { success: false, error: "Company tax ID not configured" };
    }

    // Get WHT amount from journal entries
    const whtRes = await query(`
      SELECT credit as wht_amount
      FROM journal_entries
      WHERE reference_no = $1 AND account_name ILIKE '%หัก ณ ที่จ่าย%'
      LIMIT 1
    `, [voucher.voucher_no]);

    const whtAmount = Number(whtRes.rows[0]?.wht_amount || 0);

    if (whtAmount === 0) {
      return { success: false, error: "No withholding tax found for this voucher" };
    }

    // Submit to RD
    const result = await rdClient.submitWithholdingTax({
      taxId: company.tax_id,
      recipientTaxId: voucher.recipient_tax_id || "0000000000000",
      recipientName: voucher.payee_name,
      paymentDate: new Date(voucher.issue_date).toISOString().split('T')[0],
      incomeType: "SERVICE", // License/Software service
      taxRate: 5, // Standard rate for services
      grossAmount: Number(voucher.amount),
      taxAmount: whtAmount,
      netAmount: Number(voucher.amount) - whtAmount,
      description: `Payment to ${voucher.payee_name} - ${voucher.voucher_no}`
    });

    // Update voucher with submission status
    if (result.success && result.submissionId) {
      await query(`
        UPDATE payment_vouchers
        SET rd_submission_id = $1, rd_status = $2, rd_submitted_at = NOW()
        WHERE id = $3
      `, [result.submissionId, result.status, voucherId]);
    }

    return result;
  } catch (error: any) {
    return { success: false, error: `Database error: ${error.message}` };
  }
}

// Check RD submission status
export async function checkRDSubmissionStatus(submissionId: string): Promise<RDSubmissionResult> {
  if (!rdClient) {
    return { success: false, error: "RD API client not initialized" };
  }

  return await rdClient.checkSubmissionStatus(submissionId);
}

// Batch submit multiple documents
export async function batchSubmitToRD(documentIds: string[], type: 'invoice' | 'wht'): Promise<{
  success: boolean;
  results: Array<{ id: string; result: RDSubmissionResult }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const results: Array<{ id: string; result: RDSubmissionResult }> = [];
  let successful = 0;
  let failed = 0;

  for (const id of documentIds) {
    let result: RDSubmissionResult;

    if (type === 'invoice') {
      result = await submitInvoiceToRD(id);
    } else {
      result = await submitWHTToRD(id);
    }

    results.push({ id, result });

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: failed === 0,
    results,
    summary: {
      total: documentIds.length,
      successful,
      failed
    }
  };
}
