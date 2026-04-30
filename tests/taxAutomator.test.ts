import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  InputTaxValidator,
  WithholdingTaxEngine,
  OverseasServiceTrigger,
  TaxCalendarAlerts,
  COMPANY_TAX_ID,
  COMPANY_ADDRESS
} from '../lib/taxAutomator';

describe('Tax Automator - Input Tax Validator', () => {
  test('should validate correct invoice and matching address', () => {
    const result = InputTaxValidator.validate({
      taxId: COMPANY_TAX_ID,
      address: COMPANY_ADDRESS,
      netAmount: 1000,
      vatAmount: 70,
      hasRequiredFields: true
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.isForbiddenTax, false);
    assert.strictEqual(result.capitalizedExpense, 1000); // Only net amount
    assert.strictEqual(result.errors.length, 0);
  });

  test('should flag forbidden tax if Tax ID is mismatched', () => {
    const result = InputTaxValidator.validate({
      taxId: '1234567890123',
      address: COMPANY_ADDRESS,
      netAmount: 1000,
      vatAmount: 70,
      hasRequiredFields: true
    });
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.isForbiddenTax, true);
    assert.strictEqual(result.capitalizedExpense, 1070); // Capitalized expense should include VAT
    assert.strictEqual(result.errors.some(e => e.includes('ข้อมูลระบุตัวตนผู้เสียภาษีไม่ตรงกับบริษัท')), true);
  });

  test('should flag forbidden tax if Address is mismatched', () => {
    const result = InputTaxValidator.validate({
      taxId: COMPANY_TAX_ID,
      address: 'ผิดที่อยู่ 123',
      netAmount: 1000,
      vatAmount: 70,
      hasRequiredFields: true
    });
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.isForbiddenTax, true);
    assert.strictEqual(result.capitalizedExpense, 1070); 
  });

  test('should flag forbidden tax for specific categories and capitalize expense', () => {
    const result = InputTaxValidator.validate({
      taxId: COMPANY_TAX_ID,
      address: COMPANY_ADDRESS,
      category: 'ค่ารับรอง',
      netAmount: 1000,
      vatAmount: 70,
      hasRequiredFields: true
    });
    assert.strictEqual(result.isValid, true); // Valid format, but forbidden
    assert.strictEqual(result.isForbiddenTax, true);
    assert.strictEqual(result.capitalizedExpense, 1070); // Net + VAT
  });
});

describe('Tax Automator - Withholding Tax Engine', () => {
  test('should not calculate WHT for 999.99', () => {
    const result = WithholdingTaxEngine.calculate('Service/Professional', 999.99, true);
    assert.strictEqual(result.requiresWht, false);
    assert.strictEqual(result.whtAmount, 0);
  });

  test('should calculate WHT for 1000.00', () => {
    const result = WithholdingTaxEngine.calculate('Service/Professional', 1000.00, true);
    assert.strictEqual(result.requiresWht, true);
    assert.strictEqual(result.rate, 3);
    assert.strictEqual(result.whtAmount, 30);
  });

  test('should use ภ.ง.ด. 53 for Juristic Person', () => {
    const result = WithholdingTaxEngine.calculate('Rent', 1000, true);
    assert.strictEqual(result.form, 'ภ.ง.ด. 53');
    assert.strictEqual(result.rate, 5);
  });

  test('should use ภ.ง.ด. 3 for Natural Person', () => {
    const result = WithholdingTaxEngine.calculate('Advertisement', 2000, false);
    assert.strictEqual(result.form, 'ภ.ง.ด. 3');
    assert.strictEqual(result.rate, 2);
  });

  test('should calculate 1% for Transport', () => {
    const result = WithholdingTaxEngine.calculate('Transport', 4000, true);
    assert.strictEqual(result.rate, 1);
    assert.strictEqual(result.whtAmount, 40);
  });
});

describe('Tax Automator - Overseas Service Trigger', () => {
  test('should trigger PP.36 for Foreigner Software', () => {
    const result = OverseasServiceTrigger.check('USA', 'Software');
    assert.strictEqual(result.requiresPP36, true);
  });

  test('should not trigger for Thailand', () => {
    const result = OverseasServiceTrigger.check('Thailand', 'Software');
    assert.strictEqual(result.requiresPP36, false);
  });
});

describe('Tax Automator - Tax Calendar Alerts', () => {
  test('should alert for paper on the 10th', () => {
    const date = new Date('2026-05-10T10:00:00Z');
    const alerts = TaxCalendarAlerts.getAlertsForDate(date);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].includes('แบบกระดาษ'), true);
  });

  test('should alert for e-Filing on the 17th', () => {
    const date = new Date('2026-05-17T10:00:00Z');
    const alerts = TaxCalendarAlerts.getAlertsForDate(date);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].includes('e-Filing'), true);
  });
});
