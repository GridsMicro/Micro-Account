export const COMPANY_TAX_ID = '0105561182888';
export const COMPANY_ADDRESS = '136/34 ถ.ประดิพัทธ์ แขวงพญาไท เขตพญาไท กรุงเทพฯ';

export interface InvoiceDetails {
  taxId?: string;
  address?: string;
  category?: string;
  netAmount: number;
  vatAmount?: number;
  hasRequiredFields: boolean;
  isForeigner?: boolean;
}

export class InputTaxValidator {
  /**
   * คัดกรองใบกำกับภาษีซื้อ (Vat Input Validation)
   */
  static validate(invoice: InvoiceDetails) {
    const errors: string[] = [];
    let isForbiddenTax = false;
    let capitalizedExpense = invoice.netAmount;

    // Logic 1: Tax ID & Address Match
    if ((invoice.taxId && invoice.taxId !== COMPANY_TAX_ID) || (invoice.address && invoice.address !== COMPANY_ADDRESS)) {
      isForbiddenTax = true;
      errors.push(`ข้อมูลระบุตัวตนผู้เสียภาษีไม่ตรงกับบริษัท (ต้องเป็น ${COMPANY_TAX_ID} และที่อยู่ ${COMPANY_ADDRESS})`);
    }

    // Logic 2: Forbidden Tax (ภาษีซื้อต้องห้าม)
    const forbiddenCategories = ['รถยนต์นั่งส่วนบุคคลไม่เกิน 10 ที่นั่ง', 'ค่ารับรอง'];
    if (invoice.category && forbiddenCategories.includes(invoice.category)) {
      isForbiddenTax = true;
    }

    // Logic 3: Document Integrity
    if (!invoice.hasRequiredFields) {
      errors.push('ข้อมูลบังคับไม่ครบถ้วน (เลขที่ใบกำกับ, วันที่, ชื่อ-ที่อยู่, ยอด Net, ยอด VAT)');
    }

    if (invoice.vatAmount !== undefined) {
      // คำนวณ Net * 7% = VAT
      const expectedVat = Math.round(invoice.netAmount * 0.07 * 100) / 100;
      const actualVat = Math.round(invoice.vatAmount * 100) / 100;
      
      // Allow slight floating point discrepancy (1 satang)
      if (Math.abs(expectedVat - actualVat) > 0.01) {
        errors.push(`ยอด VAT ไม่ถูกต้อง (คาดหวัง: ${expectedVat}, ระบุ: ${actualVat})`);
      }

      // Accounting Entry for Forbidden Tax
      if (isForbiddenTax) {
        capitalizedExpense = Math.round((invoice.netAmount + invoice.vatAmount) * 100) / 100;
      }
    }

    return {
      isValid: errors.length === 0,
      isForbiddenTax,
      capitalizedExpense,
      errors
    };
  }
}

export class WithholdingTaxEngine {
  /**
   * คำนวณภาษีหัก ณ ที่จ่าย
   */
  static calculate(serviceType: string, amount: number, isJuristicPerson: boolean, hasContinuousContract: boolean = false) {
    // Condition: Check amount < 1000 and no continuous contract
    if (amount < 1000 && !hasContinuousContract) {
      return { requiresWht: false, rate: 0, whtAmount: 0, form: null };
    }

    let rate = 0;

    // Map serviceType to rate
    switch (serviceType) {
      case 'Rent':
        rate = 5;
        break;
      case 'Service/Professional':
        rate = 3;
        break;
      case 'Advertisement':
        rate = 2;
        break;
      case 'Transport':
        rate = 1;
        break;
      default:
        return { requiresWht: false, rate: 0, whtAmount: 0, form: null };
    }

    // Form mapping based on payee type
    const form = isJuristicPerson ? 'ภ.ง.ด. 53' : 'ภ.ง.ด. 3';

    const whtAmount = Math.round(amount * (rate / 100) * 100) / 100;

    return {
      requiresWht: true,
      rate,
      whtAmount,
      form
    };
  }
}

export class OverseasServiceTrigger {
  /**
   * ธุรกรรมต่างประเทศ (ภ.พ. 36)
   */
  static check(vendorCountry: string, category: string) {
    const serviceCategories = ['Service', 'Software', 'ค่าบริการ', 'ค่า License/Software', 'Service/Professional'];
    
    if (vendorCountry !== 'Thailand' && serviceCategories.includes(category)) {
      return {
        requiresPP36: true,
        message: 'ระบบตรวจพบการจ่ายเงินให้ Vendor ต่างประเทศ: กรุณาจัดทำ ภ.พ. 36 เพื่อนำส่ง VAT 7% แทนผู้ให้บริการ'
      };
    }

    return { requiresPP36: false, message: null };
  }
}

export class TaxCalendarAlerts {
  /**
   * ระบบแจ้งเตือน Deadline ปฏิทินภาษี
   */
  static getAlertsForDate(currentDate: Date) {
    const alerts: string[] = [];
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1; // 1-12

    // ทุกวันที่ 1, 5, 10
    if ([1, 5, 10].includes(day)) {
      alerts.push('แจ้งเตือน (แบบกระดาษ): กรุณาเตรียมการยื่น ภ.พ. 30, ภ.ง.ด. 3, 53 และ ภ.พ. 36 สำหรับเดือนนี้');
    }

    // ทุกวันที่ 15-20
    if (day >= 15 && day <= 20) {
      alerts.push('แจ้งเตือน (e-Filing): ช่วงเวลาสำหรับการยื่น ภ.พ. 30, ภ.ง.ด. 3, 53 และ ภ.พ. 36 ผ่านระบบ e-Filing');
    }

    // สิงหาคม (เดือน 8)
    if (month === 8 && day === 1) { // Alert at the beginning of August
      alerts.push('แจ้งเตือนประจำปี: เดือนสิงหาคมถึงกำหนดการประมาณการ ภ.ง.ด. 51 (ต้องไม่ต่ำกว่า 25% ของกำไรจริงตอนปลายปีเพื่อเลี่ยงเงินเพิ่ม 20%)');
    }

    return alerts;
  }
}
