import { query } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

async function getExpenseData(id: string) {
  try {
    const expRes = await query(
      `
        SELECT e.*, c.name as vendor_name, c.address as vendor_address, c.tax_id as vendor_tax_id, c.phone as vendor_phone
        FROM expenses e
        LEFT JOIN contacts c ON c.id = e.contact_id
        WHERE e.id = $1
      `,
      [id]
    );
    if (expRes.rows.length === 0) return null;
    const expense = expRes.rows[0];

    const companyRes = await query(`SELECT * FROM company_settings LIMIT 1`).catch(() => ({ rows: [] as any[] }));
    const company = companyRes.rows[0] || {};

    return { expense, company };
  } catch (error) {
    return null;
  }
}

function numberToThaiWords(num: number): string {
  const thaiNumbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiPlaces = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  if (num === 0) return 'ศูนย์บาทถ้วน';
  
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  
  let result = '';
  const bahtStr = baht.toString();
  
  for (let i = 0; i < bahtStr.length; i++) {
    const digit = parseInt(bahtStr[i]);
    const place = bahtStr.length - i - 1;
    
    if (digit !== 0) {
      if (place === 1 && digit === 1) {
        result += 'สิบ';
      } else if (place === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (place === 0 && digit === 1 && bahtStr.length > 1) {
        result += 'เอ็ด';
      } else {
        result += thaiNumbers[digit] + thaiPlaces[place];
      }
    }
  }
  
  result += 'บาท';
  
  if (satang > 0) {
    if (satang >= 10) {
      const ten = Math.floor(satang / 10);
      const one = satang % 10;
      if (ten === 2) result += 'ยี่สิบ';
      else if (ten === 1) result += 'สิบ';
      else result += thaiNumbers[ten] + 'สิบ';
      if (one === 1) result += 'เอ็ด';
      else if (one > 0) result += thaiNumbers[one];
    } else {
      result += thaiNumbers[satang];
    }
    result += 'สตางค์';
  } else {
    result += 'ถ้วน';
  }
  
  return result;
}

export default async function Wht53Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getExpenseData(id);
  if (!data) return notFound();

  const { expense, company } = data;
  
  // Calculate WHT based on stored values or calculate from amount
  const netAmount = Number(expense.net_amount || expense.amount || 0);
  const whtRate = Number(expense.wht_rate || 3);
  const whtAmount = Number(expense.wht_amount || (netAmount * whtRate / 100));
  
  const issueDate = new Date(expense.expense_date || expense.created_at);
  const thaiDate = issueDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const bahtText = numberToThaiWords(whtAmount);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 print:bg-white print:p-0 md:px-0">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Controls */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 print:hidden">
          <Link href={`/expenses`} className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-violet-600">
            <ArrowLeft size={18} /> ย้อนกลับค่าใช้จ่าย
          </Link>
          <div className="flex items-center gap-3">
            <PrintButton />
          </div>
        </div>

        {/* WHT Certificate Form */}
        <div className="overflow-hidden bg-white print:shadow-none print:border-none border border-slate-200">
          <div className="p-12 md:p-16 text-slate-800 text-sm">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-xl font-bold">หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
              <p className="text-sm">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
              <p className="text-sm">(ภ.ง.ด. 53)</p>
            </div>

            {/* Form Number */}
            <div className="flex justify-end mb-4">
              <p className="text-sm">เลขที่: <span className="font-bold">WHT53-{expense.id.toString().padStart(5, '0')}</span></p>
            </div>

            {/* Company & Vendor Info */}
            <div className="grid grid-cols-1 gap-6 border p-6 mb-6 pb-8">
              <div>
                <span className="font-bold">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย:</span>
                <p className="mt-1">{company.name || "MICROTRONIC (THAILAND) CO., LTD."}</p>
                <p>{company.address || "136/34 หมู่ที่ 4 ถนนพหลโยธิน ตำบลคูคต อำเภอลำลูกกา จังหวัดปทุมธานี 12130"}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {company.tax_id || "0105561182888"}</p>
              </div>
              
              <div className="border-t pt-6">
                <span className="font-bold">ผู้ถูกหักภาษี ณ ที่จ่าย:</span>
                <p className="mt-1">{expense.vendor_name || expense.vendor || "-"}</p>
                <p>{expense.vendor_address || "-"}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {expense.vendor_tax_id || "-"}</p>
              </div>
            </div>

            {/* Payment Details */}
            <table className="w-full border-collapse border border-slate-800 text-sm mt-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-800 p-2 w-1/2 text-left">ประเภทเงินได้ที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-center">วันเดือนปีที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-center">จำนวนเงินที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-center">ภาษีที่หัก</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-800 p-3">
                    <p>{expense.title || "ค่าบริการ/ค่า License"}</p>
                    <p className="text-xs text-slate-500 mt-1">{expense.tax_invoice_no || expense.reference_no || ""}</p>
                  </td>
                  <td className="border border-slate-800 p-3 text-center">{thaiDate}</td>
                  <td className="border border-slate-800 p-3 text-right">
                    ฿{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-800 p-3 text-right">
                    <span className="font-bold">฿{whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <p className="text-xs text-slate-500">({whtRate}%)</p>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={3} className="border border-slate-800 p-3 text-right font-bold">รวมภาษีที่หัก</td>
                  <td className="border border-slate-800 p-3 text-right font-bold text-violet-600">
                    ฿{whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm">
                <span className="font-bold">จำนวนเงินภาษีที่หัก (ตัวอักษร):</span>
              </p>
              <p className="text-lg font-medium mt-1">{bahtText}</p>
            </div>

            {/* Declaration */}
            <div className="mt-8 text-sm space-y-2">
              <p>ข้าพเจ้าขอรับรองว่า ข้อความข้างต้นเป็นความจริงทุกประการ</p>
              <p className="mt-4">ลงชื่อ .................................................. ผู้มีหน้าที่หักภาษี</p>
              <p className="mt-2">( {company.name || "MICROTRONIC (THAILAND) CO., LTD."} )</p>
              <p className="mt-1">วันที่ ................../................../................</p>
            </div>

            {/* Footer Notes */}
            <div className="mt-12 pt-8 border-t text-xs text-slate-500 space-y-1">
              <p>* หนังสือรับรองนี้ใช้เป็นหลักฐานสำหรับผู้ถูกหักภาษี ณ ที่จ่าย นำไปหักภาษีเงิได้สิ้นปีได้</p>
              <p>* ผู้มีหน้าที่หักต้องยื่นแบบ ภ.ง.ด. 53 พร้อมนำส่งภาษีที่หักให้สรรพากรภายในวันที่ 15 ของเดือนถัดไป</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
