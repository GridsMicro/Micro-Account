/**
 * RD Open API (e-Filing) integration — 2026-11-18 (ฌอน / ข้อ 3)
 *
 * แทนที่โค้ดเดิมที่ยิง /oauth/token + /api/v1/... (endpoint ที่ไม่มีจริง)
 * ด้วย endpoint จาก spec ทางการของกรมสรรพากร:
 *   https://efiling.rd.go.th/rd-cms/api
 *
 *   POST /oapi/submit-filing-auth  ยืนยันตัวตน → tokenId + sender.id
 *   POST /oapi/submit-form         นำส่งแบบ (formType PP30 = ภ.พ.30)
 *   POST /oapi/result-form         สอบถามสถานะแบบ (refNo / apiRefNo)
 *   POST /oapi/receipt-form        ขอภาพแบบ / ใบแนบ / ใบเสร็จ
 *   POST /oapi/payin-form          ขอใบ Pay-In
 *   POST /oapi/cancel-form         ยกเลิกแบบ (อันตราย — ต้องยืนยันก่อนเสมอ)
 *
 * ⚠️ ข้อควรระวัง (อ่านก่อนใช้งานจริง):
 *  1. ต้องสมัคร Open API กับสรรพากร (แบบ ภ.อ.01.2 + ผู้ให้บริการตัวแทนหรือผู้เสียภาษี)
 *     และใช้ใบรับรอง NRCA ตามที่กรมกำหนด — ถ้าไม่มี credential ฟังก์ชันทั้งหมดจะ
 *     คืน success:false ทันที ไม่ปลอมผลสำเร็จ
 *  2. ทุกฟังก์ชันที่ "เขียน" (submit / cancel / sync) ต้องถูกเรียกจาก user action
 *     ที่ผู้ใช้กดยืนยันเท่านั้น — ห้ามเรียกจาก cron หรือ useEffect แบบเงียบ ๆ
 *  3. ระบบเก็บสถานะลงตาราง tax_filing_submissions ใน DB ของแอพ (CREATE IF NOT EXISTS)
 *     — ไม่ได้แก้ข้อมูลภาษีใน expenses/invoices
 *  4. ผล responseCode P01001 = "กำลังประมวลผล" → ยังไม่มี refNo ต้องใช้ apiRefNo
 *     สอบถามซ้ำผ่าน result-form (ไม่ถือว่ายื่นสำเร็จจนกว่า formStatusId ปรากฏ)
 */

import { query } from "@/lib/db";

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://efiling.rd.go.th/rd-cms";
export const RD_SUCCESS_CODE = "I01000";
export const RD_PROCESSING_CODE = "P01001";

// spec ไม่ระบุอายุ token → ใช้ cache แบบอนุรักษ์นิยม 10 นาที + retry ครั้งเดียวถ้า 401
const TOKEN_CACHE_MS = 10 * 60 * 1000;

export type RDFormType = "PP30" | "PP36" | "PND3" | "PND53" | "PND90" | "PND91" | "PND54";

export interface RDConfig {
  username: string;
  password: string;
  senderId: string;
  /** 1 = ผู้มีหน้าที่เสียอากร, 2 = ผู้ให้บริการตัวแทน (default 2 ตามตัวอย่างใน spec) */
  role: 1 | 2;
  baseUrl: string;
  /** version ของแบบ ภ.พ.30 — ตั้งผ่าน env ได้ถ้ากรมอัปเดตแบบฟอร์ม */
  pp30Version: string;
}

export interface RDResult {
  success: boolean;
  responseCode?: string;
  responseMessage?: string;
  requestId?: string;
  /** เลขอ้างอิงการนำส่ง — ใช้สอบถามสถานะต่อเมื่อระบบยังประมวลผลอยู่ */
  apiRefNo?: string;
  /** เลขอ้างอิงการยื่นแบบ (13 หลัก) */
  refNo?: string;
  formStatusId?: string;
  statusLabel?: string;
  totalAmount?: number;
  totalPenalty?: number;
  totalSurcharge?: number;
  totalFine?: number;
  attachedFiles?: Array<{ docType: string; fileName: string; file: string }>;
  error?: string;
  /** เก็บ response ดิบไว้ตรวจสอบ — ห้าม log tokenId ออกมา */
  raw?: unknown;
}

/** formStatusId ตามตารางรหัสข้อความของ RD (jsp. result-form / submit-form) */
export const RD_FORM_STATUS_LABELS: Record<string, string> = {
  "1": "รอการชำระเงิน",
  "2": "ชำระภาษีสำเร็จ รอตรวจสอบ",
  "3": "ยื่นแบบสำเร็จ รอออกใบเสร็จรับเงิน",
  "4": "ยื่นแบบสำเร็จ ออกใบเสร็จรับเงินแล้ว",
  "5": "เกินกำหนดชำระเงิน",
  "6": "ยกเลิกแบบ",
  "7": "ยื่นแบบสำเร็จ รอประมวลผล",
  "8": "ยื่นแบบสำเร็จ",
};

// ---------------------------------------------------------------------------
// Config (อ่าน env ตอนเรียก — ไม่ใช่ตอน import — เพื่อให้ Vercel runtime env ทำงาน)
// ---------------------------------------------------------------------------

/** config override จาก setupRDAPI() เดิม — เก็บไว้เพื่อ backward compatibility */
let configOverride: RDConfig | null = null;

export function getRDConfig(): RDConfig | null {
  const username = process.env.RD_EFILING_USERNAME;
  const password = process.env.RD_EFILING_PASSWORD;
  const senderId = process.env.RD_EFILING_SENDER_ID;
  if (!username || !password || !senderId) return null;
  return {
    username,
    password,
    senderId,
    role: process.env.RD_EFILING_ROLE === "1" ? 1 : 2,
    baseUrl: process.env.RD_EFILING_BASE_URL || DEFAULT_BASE_URL,
    pp30Version: process.env.RD_EFILING_PP30_VERSION || "1.0.0",
  };
}

/** @deprecated ใช้ env แทน — เก็บไว้ให้ setupRDAPI() เดิมยัง compile ได้ */
export function initializeRDClient(config: Partial<RDConfig>): void {
  const base = getRDConfig() || {
    username: "", password: "", senderId: "",
    role: 2, baseUrl: DEFAULT_BASE_URL, pp30Version: "1.0.0",
  };
  configOverride = { ...base, ...config } as RDConfig;
}

function resolveConfig(): RDConfig | null {
  return configOverride || getRDConfig();
}

export function isRDConfigured(): boolean {
  return Boolean(resolveConfig());
}

function notConfigured(): RDResult {
  return {
    success: false,
    error: "ยังไม่ได้ตั้งค่า RD Open API — ต้องระบุ RD_EFILING_USERNAME / RD_EFILING_PASSWORD / RD_EFILING_SENDER_ID ใน environment",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** nonce ตาม spec = "YYYY-MM-DD HH:MM:SS" (เวลาท้องถิ่น) */
function formatNonce(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** requestId ต้องไม่ซ้ำในแต่ละ request (spec จำกัด 50 ตัวอักษร) */
function makeRequestId(prefix = "MA"): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(0, 50);
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function parseRDResponse(json: any, httpStatus: number): RDResult {
  const envelope = json?.eFiling;
  const resp = envelope?.response || {};
  const result = envelope?.result || {};
  const code = String(resp.responseCode || "").trim();

  // I01000 = สำเร็จ / P01001 = กำลังประมวลผล (ยังไม่มี refNo — ต้อง poll ต่อ)
  const success = code === RD_SUCCESS_CODE || code === RD_PROCESSING_CODE;
  const formStatusId = result.formStatusId != null ? String(result.formStatusId) : undefined;

  const num = (v: unknown) => (v == null ? undefined : Number(v));
  return {
    success,
    responseCode: code || undefined,
    responseMessage: resp.responseMessage || resp.responseMsg || undefined,
    requestId: result.requestId || undefined,
    apiRefNo: result.apiRefNo || undefined,
    refNo: result.refNo || undefined,
    formStatusId,
    statusLabel: formStatusId ? RD_FORM_STATUS_LABELS[formStatusId] : undefined,
    totalAmount: num(result.totalAmount),
    totalPenalty: num(result.totalPenalty),
    totalSurcharge: num(result.totalSurcharge),
    totalFine: num(result.totalFine),
    attachedFiles: Array.isArray(result.attachedFiles) ? result.attachedFiles : undefined,
    error: success
      ? undefined
      : resp.responseMessage || resp.responseMsg || code || `RD API ตอบ HTTP ${httpStatus}`,
    raw: json,
  };
}

/** อนุมาน formType จาก refNo เฉพาะสำหรับเก็บประวัติ — ไม่ใช้ตัดสินใจทางภาษี */
function inferFormType(refNo?: string): string {
  if (!refNo) return "UNKNOWN";
  if (refNo.startsWith("P3")) return "PP30";
  if (refNo.startsWith("P5")) return "PND";
  return "UNKNOWN";
}

// ---------------------------------------------------------------------------
// PP30 payload
// ---------------------------------------------------------------------------

/**
 * สร้าง formData ของ ภ.พ.30 ตามตัวอย่างใน spec (formType PP30, version 1.0.0)
 *
 * ⚠️ สำคัญ: โครงสร้างนี้ internal มาจาก "ตัวอย่าง Request Body" ที่กรมเผยแพร่
 * ไม่ใช่ technical spec ฉบับเต็ม (ต้องดาวน์โหลด "การสร้างข้อมูลแบบแสดงรายการภาษี
 * สำหรับนำส่งผ่านอินเทอร์เน็ตทาง API" จากหน้าเดียวกันมาทียบก่อนยื่นจริง)
 * โดยเฉพาะ formAttach.attachDet — ต้องตรวจกับ RD Prep V รุ่นปรับปรุง
 * (แบบปรับปรุงเริ่ม 1 มี.ค. 2569) ก่อนใช้งานกับงวดหลังจากนั้น
 */
export function buildPP30FormData(input: {
  taxId: string;
  branchNo?: number;
  taxMonth: number;
  taxYear: number;
  salesTaxable: number;
  salesVat: number;
  purchaseTaxable: number;
  purchaseVat: number;
}) {
  const salesBase = round2(input.salesTaxable);
  const salesVat = round2(input.salesVat);
  const purchaseBase = round2(input.purchaseTaxable);
  const purchaseVat = round2(input.purchaseVat);
  const netVat = round2(salesVat - purchaseVat);
  const due = netVat > 0 ? netVat : 0;
  const branchNo = input.branchNo ?? 0;

  const saleTax = {
    amt: salesBase,
    extra: { amtS: null, amtB: null },
    expAmt: null,
    exeAmt: null,
    vatAmt: salesVat,
    monTax: salesVat,
  };
  const purchaseTax = {
    amt: purchaseBase,
    extra: { amtB: null, amtS: null },
    monTax: purchaseVat,
  };

  return {
    taxPayer: {
      specifiedTaxRegistration: { id: input.taxId },
      branchNo,
      branchType: "V",
    },
    taxForm: {
      taxPeriod: {
        taxMonth: input.taxMonth,
        // spec ใช้ปี พ.ศ. (ตัวอย่าง 2566) — ไม่ใช่ ค.ศ.
        taxYear: input.taxYear,
      },
      filing: { filingType: "0", filingNo: 0, filingCase: "1" },
      // สะกดตาม spec ("consolidatiton") — อย่าแก้เป็น consolidation
      consolidatitonFilingStatus: 1,
    },
    taxFormDetail: {
      detail: {
        saleTax,
        purchaseTax,
        calculate: {
          diffTaxAmtU: due,
          diffTaxAmtO: null,
          oldFwdTax: 0,
          diffTotTaxAmtU: due,
          diffTotTaxAmtO: null,
          diffTotAmtU: due,
          diffTotAmtO: null,
          refundType: 1,
          vatRate: 0.07,
        },
      },
    },
    formAttach: {
      attachDet: [
        {
          seq: 1,
          taxPayer: {
            branchNo,
            address: { buildingNumber: "", postCode: "" },
            taxDetail: {
              diffTaxAmtU: due,
              diffTaxAmtO: null,
              saleTax,
              purchaseTax,
            },
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Low-level client
// ---------------------------------------------------------------------------

class RDAPIClient {
  private config: RDConfig;
  private tokenId: string | null = null;
  private senderId: string;
  private tokenExpiry: Date | null = null;

  constructor(config: RDConfig) {
    this.config = config;
    this.senderId = config.senderId;
  }

  private async authenticate(): Promise<void> {
    const res = await fetch(`${this.config.baseUrl}/oapi/submit-filing-auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // ⚠️ ไม่ log body — มี password อยู่ข้างใน
      body: JSON.stringify({
        eFiling: {
          username: this.config.username,
          password: this.config.password,
          nonce: formatNonce(new Date()),
        },
      }),
      cache: "no-store",
    });

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`RD auth ตอบไม่ใช่ JSON (HTTP ${res.status})`);
    }

    const parsed = parseRDResponse(json, res.status);
    if (!parsed.success) {
      throw new Error(
        `RD auth ไม่สำเร็จ [${parsed.responseCode || "?"}] ${parsed.responseMessage || parsed.error || ""}`.trim()
      );
    }
    // กรณี P01001 ตอน auth ไม่คาดคิด — ไม่มี token → ให้ error ชัดเจน
    const token = json?.eFiling?.result?.tokenId;
    if (!token) {
      throw new Error(`RD auth ไม่ส่ง tokenId มา [${parsed.responseCode}]`);
    }
    this.tokenId = token;
    this.senderId = json?.eFiling?.result?.sender?.id || this.senderId;
    this.tokenExpiry = new Date(Date.now() + TOKEN_CACHE_MS);
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.tokenId || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  /** POST พร้อม Bearer token; retry ครั้งเดียวถ้า 401/403 (token เก่า) */
  private async post(path: string, body: unknown): Promise<{ json: any; status: number }> {
    const doFetch = async (): Promise<{ res: Response; json: any }> => {
      await this.ensureAuthenticated();
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.tokenId}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const text = await res.text();
      let json: any;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`RD ${path} ตอบไม่ใช่ JSON (HTTP ${res.status})`);
      }
      return { res, json };
    };

    let { res, json } = await doFetch();
    if ((res.status === 401 || res.status === 403) && this.tokenId) {
      // token หมดอายุก่อนที่เราจะคิด → ล้างแล้วลองใหม่ครั้งเดียว
      this.tokenId = null;
      this.tokenExpiry = null;
      ({ res, json } = await doFetch());
    }
    return { json, status: res.status };
  }

  /** ส่งแบบภาษีผ่าน /oapi/submit-form */
  async submitForm(formType: RDFormType, formData: unknown, version: string): Promise<RDResult> {
    try {
      const body = {
        eFiling: {
          sender: { id: this.senderId, role: this.config.role },
          requestId: makeRequestId(),
          rdForm: {
            exchangeDocument: { formType, version },
            formData: Array.isArray(formData) ? formData : [formData],
          },
        },
      };
      const { json, status } = await this.post("/oapi/submit-form", body);
      return parseRDResponse(json, status);
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /** สอบถามสถานะแบบ (/oapi/result-form) — READ-ONLY ต่อ RD */
  async queryStatus(refNo?: string, apiRefNo?: string): Promise<RDResult> {
    try {
      const rdForm: Record<string, string> = {};
      if (refNo) rdForm.refNo = refNo;
      if (apiRefNo) rdForm.apiRefNo = apiRefNo;
      if (!rdForm.refNo && !rdForm.apiRefNo) {
        return { success: false, error: "ต้องระบุ refNo หรือ apiRefNo เพื่อสอบถามสถานะ" };
      }
      const { json, status } = await this.post("/oapi/result-form", {
        eFiling: { sender: { id: this.senderId }, rdForm },
      });
      return parseRDResponse(json, status);
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /** ขอภาพแบบ/ใบแนบ/ใบเสร็จ (/oapi/receipt-form) — READ-ONLY ต่อ RD */
  async requestReceipt(refNo: string, requestType: 1 | 2 | 3): Promise<RDResult> {
    try {
      const { json, status } = await this.post("/oapi/receipt-form", {
        eFiling: {
          sender: { id: this.senderId },
          rdForm: { refNo, requestType: String(requestType) },
        },
      });
      return parseRDResponse(json, status);
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /** ขอใบ Pay-In (/oapi/payin-form) */
  async requestPayin(refNos: string[], requestType: 1 | 2 | 3 = 1, paymentCode?: string): Promise<RDResult> {
    try {
      const rdForm: Record<string, unknown> = { requestType: String(requestType) };
      if (refNos.length) rdForm.refNo = refNos;
      if (paymentCode) rdForm.paymentCode = paymentCode;
      const { json, status } = await this.post("/oapi/payin-form", {
        eFiling: { sender: { id: this.senderId }, rdForm },
      });
      return parseRDResponse(json, status);
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /** ยกเลิกแบบ (/oapi/cancel-form) — เรียกได้เฉพาะหลังผู้ใช้ยืนยันชัดเจน */
  async cancelFiling(refNo: string, formType: string): Promise<RDResult> {
    try {
      const { json, status } = await this.post("/oapi/cancel-form", {
        eFiling: {
          sender: { id: this.senderId },
          requestId: makeRequestId(),
          rdForm: {
            exchangeDocument: { formType },
            refNo,
          },
        },
      });
      return parseRDResponse(json, status);
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }
}

// ---------------------------------------------------------------------------
// Local status store (tax_filing_submissions)
// ---------------------------------------------------------------------------

async function ensureFilingSubmissionsTable(): Promise<void> {
  // CREATE IF NOT EXISTS → ปลอดภัยกับ production ที่มีตารางอยู่แล้ว
  await query(`
    CREATE TABLE IF NOT EXISTS tax_filing_submissions (
      id SERIAL PRIMARY KEY,
      lookup_key VARCHAR(64) NOT NULL UNIQUE,
      form_type VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
      tax_month INTEGER,
      tax_year INTEGER,
      request_id VARCHAR(50),
      api_ref_no VARCHAR(20),
      ref_no VARCHAR(13),
      form_status_id VARCHAR(2),
      status_label TEXT,
      total_amount NUMERIC(13,2) DEFAULT 0,
      total_penalty NUMERIC(13,2) DEFAULT 0,
      total_surcharge NUMERIC(13,2) DEFAULT 0,
      total_fine NUMERIC(13,2) DEFAULT 0,
      raw_response JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function upsertFilingStatus(data: {
  formType?: string;
  taxMonth?: number;
  taxYear?: number;
  result: RDResult;
}): Promise<void> {
  // ต้องมี identifier สักอย่างก่อนถึงจะ upsert ได้ (ไม่งั้นจะไปทับ key ว่าง)
  const lookupKey = data.result.apiRefNo || data.result.refNo || data.result.requestId;
  if (!lookupKey) return;

  await ensureFilingSubmissionsTable();
  await query(
    `INSERT INTO tax_filing_submissions (
       lookup_key, form_type, tax_month, tax_year, request_id, api_ref_no, ref_no,
       form_status_id, status_label, total_amount, total_penalty, total_surcharge,
       total_fine, raw_response, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (lookup_key) DO UPDATE SET
       form_type = EXCLUDED.form_type,
       tax_month = COALESCE(EXCLUDED.tax_month, tax_filing_submissions.tax_month),
       tax_year = COALESCE(EXCLUDED.tax_year, tax_filing_submissions.tax_year),
       form_status_id = EXCLUDED.form_status_id,
       status_label = EXCLUDED.status_label,
       total_amount = EXCLUDED.total_amount,
       total_penalty = EXCLUDED.total_penalty,
       total_surcharge = EXCLUDED.total_surcharge,
       total_fine = EXCLUDED.total_fine,
       raw_response = EXCLUDED.raw_response,
       updated_at = CURRENT_TIMESTAMP`,
    [
      lookupKey,
      data.formType || inferFormType(data.result.refNo),
      data.taxMonth ?? null,
      data.taxYear ?? null,
      data.result.requestId || null,
      data.result.apiRefNo || null,
      data.result.refNo || null,
      data.result.formStatusId || null,
      data.result.statusLabel || null,
      data.result.totalAmount ?? 0,
      data.result.totalPenalty ?? 0,
      data.result.totalSurcharge ?? 0,
      data.result.totalFine ?? 0,
      JSON.stringify(data.result.raw ?? null),
    ]
  );
}

// ---------------------------------------------------------------------------
// Public API — ใช้จาก server actions เท่านั้น
// ---------------------------------------------------------------------------

/**
 * ยื่น ภ.พ.30 ผ่าน RD Open API + บันทึกผลลง tax_filing_submissions
 * ⚠️ เรียกได้เฉพาะหลังผู้ใช้กดยืนยัน (ห้ามเรียกจาก cron / effect อัตโนมัติ)
 */
export async function submitPP30ToRD(input: {
  taxId: string;
  taxMonth: number;
  taxYear: number;
  salesTaxable: number;
  salesVat: number;
  purchaseTaxable: number;
  purchaseVat: number;
  branchNo?: number;
}): Promise<RDResult> {
  const config = resolveConfig();
  if (!config) return notConfigured();

  if (!/^\d{13}$/.test(input.taxId)) {
    return { success: false, error: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" };
  }
  if (input.taxMonth < 1 || input.taxMonth > 12) {
    return { success: false, error: "เดือนภาษีไม่ถูกต้อง (1-12)" };
  }

  const client = new RDAPIClient(config);
  const result = await client.submitForm(
    "PP30",
    buildPP30FormData(input),
    config.pp30Version
  );

  // บันทึกเฉพาะกรณี RD รับเรื่องแล้ว (มี requestId/refNo/apiRefNo)
  if (result.success && (result.refNo || result.apiRefNo || result.requestId)) {
    try {
      await upsertFilingStatus({
        formType: "PP30",
        taxMonth: input.taxMonth,
        taxYear: input.taxYear,
        result,
      });
    } catch (error: any) {
      // ไม่ทำให้การยื่นดูเหมือนล้มเหลว — แต่ต้องเตือนให้เช็กประวัติ
      result.responseMessage = `${result.responseMessage || ""} (เตือน: บันทึกสถานะในแอพไม่สำเร็จ: ${error.message})`.trim();
    }
  }
  return result;
}

/** สอบถามสถานะจาก RD แบบ READ-ONLY (ไม่เขียน DB) */
export async function queryRDStatus(input: { refNo?: string; apiRefNo?: string }): Promise<RDResult> {
  const config = resolveConfig();
  if (!config) return notConfigured();
  return new RDAPIClient(config).queryStatus(input.refNo, input.apiRefNo);
}

/**
 * ซิงค์สถานะจาก RD มาบันทึกในแอพ
 * — write เฉพาะตาราง tax_filing_submissions (ไม่แตะ expenses/invoices)
 */
export async function syncRDFilingStatus(input: {
  refNo?: string;
  apiRefNo?: string;
  formType?: string;
}): Promise<RDResult> {
  const result = await queryRDStatus(input);
  if (result.success) {
    try {
      await upsertFilingStatus({
        formType: input.formType,
        result,
      });
    } catch (error: any) {
      result.responseMessage = `${result.responseMessage || ""} (เตือน: บันทึกสถานะในแอพไม่สำเร็จ: ${error.message})`.trim();
    }
  }
  return result;
}

/**
 * ประวัติสถานะที่ซิงค์ไว้ (อ่านจาก DB ของแอพ)
 * — ไม่สร้างตารางที่นี่: หน้า /tax-reports เป็น read-only ตอน render
 * — ตารางจะถูกสร้างตอนผู้ใช้กดซิงค์/ยื่นครั้งแรกเท่านั้น
 */
export async function getRDFilingHistory(limit = 10): Promise<any[]> {
  try {
    const res = await query(
      `SELECT id, form_type, tax_month, tax_year, ref_no, api_ref_no, form_status_id,
              status_label, total_amount, total_penalty, total_surcharge, total_fine,
              created_at, updated_at
       FROM tax_filing_submissions ORDER BY updated_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  } catch {
    // ยังไม่เคยซิงค์ → ตารางยังไม่มี — ไม่ใช่ error
    return [];
  }
}

/** ขอใบเสร็จ/ภาพแบบ (READ-ONLY) */
export async function getRDReceipt(refNo: string, requestType: 1 | 2 | 3 = 3): Promise<RDResult> {
  const config = resolveConfig();
  if (!config) return notConfigured();
  return new RDAPIClient(config).requestReceipt(refNo, requestType);
}

/** ขอใบ Pay-In */
export async function getRDPayin(refNos: string[]): Promise<RDResult> {
  const config = resolveConfig();
  if (!config) return notConfigured();
  return new RDAPIClient(config).requestPayin(refNos);
}

/**
 * ยกเลิกแบบที่ยื่นไปแล้ว — อันตรายมาก
 * ต้องส่ง confirmText ที่ตรงกับ "ยกเลิกแบบ" ทุกครั้ง (ป้องกันการเรียกผิดโดยอัตโนมัติ)
 */
export async function cancelRDFiling(
  refNo: string,
  formType: string,
  confirmText: string
): Promise<RDResult> {
  if (confirmText !== "ยกเลิกแบบ") {
    return { success: false, error: "ต้องยืนยันการยกเลิกด้วยข้อความ 'ยกเลิกแบบ'" };
  }
  const config = resolveConfig();
  if (!config) return notConfigured();
  const result = await new RDAPIClient(config).cancelFiling(refNo, formType);
  if (result.success) {
    await upsertFilingStatus({ formType, result });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Deprecated shims — ปิดช่องทาง "success ปลอม" ของโค้ดเก่า
// ---------------------------------------------------------------------------

/**
 * @deprecated RD Open API ชุดนี้เป็น endpoint สำหรับ "ยื่นแบบภาษี" เท่านั้น
 * ไม่รองรับการส่ง e-Tax Invoice รายใบ (คนละระบบกับ e-Tax Invoice & e-Receipt)
 */
export async function submitInvoiceToRD(_invoiceId: string): Promise<RDResult> {
  return {
    success: false,
    error: "RD Open API ไม่รองรับการยื่น e-Tax Invoice รายใบผ่าน endpoint นี้ — ใช้ submitPP30ToRD สำหรับ ภ.พ.30",
  };
}

/** @deprecated ดู submitInvoiceToRD — ต้องใช้ช่องทาง ภ.ง.ด.53 แบบฟอร์มแยก (ยังไม่ได้ implements) */
export async function submitWHTToRD(_voucherId: string): Promise<RDResult> {
  return {
    success: false,
    error: "การยื่น ภ.ง.ด.53 ผ่าน Open API ยังไม่ได้เปิดใช้งาน — กรุณายื่นผ่าน e-Filing ของสรรพากร",
  };
}

/** @deprecated ใช้ queryRDStatus() แทน (READ-ONLY, ไม่เขียน DB) */
export async function checkRDSubmissionStatus(submissionId: string): Promise<RDResult> {
  return queryRDStatus({ apiRefNo: submissionId });
}

/** @deprecated ห้ามส่ง success ปลอม — ใช้ submitPP30ToRD ต่อรายการแทน */
export async function batchSubmitToRD(
  ids: string[],
  _type: "invoice" | "wht"
): Promise<{
  success: boolean;
  error?: string;
  results: Array<{ id: string; result: RDResult }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const message =
    "การส่งแบบภาษีต้องระบุงวดภาษีและข้อมูลจริงต่อครั้ง — ใช้ submitPP30ToRD(month, year) แทน";
  return {
    success: false,
    error: message,
    results: ids.map((id) => ({ id, result: { success: false, error: message } })),
    summary: { total: ids.length, successful: 0, failed: ids.length },
  };
}
