// =====================================================
// Micro-Account: P&L Calculation Helper
// Calculates Net Profit by aggregating COA accounts
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import { query } from './db';

export interface PLSummary {
  period: {
    startDate: string;
    endDate: string;
    fiscalYear: number;
    fiscalMonth: number;
  };
  revenue: {
    totalRevenue: number;
    salesRevenue: number;
    otherRevenue: number;
    breakdown: RevenueBreakdown[];
  };
  expenses: {
    totalExpenses: number;
    operatingExpenses: number;
    costOfGoodsSold: number;
    breakdown: ExpenseBreakdown[];
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
}

export interface RevenueBreakdown {
  accountCode: string;
  accountName: string;
  amount: number;
  percentage: number;
}

export interface ExpenseBreakdown {
  accountCode: string;
  accountName: string;
  amount: number;
  percentage: number;
  category: string;
}

// COA Account Categories for P&L
export const COA_CATEGORIES = {
  REVENUE: {
    SALES_REVENUE: 4110,
    SALES_DISCOUNTS: 4120,
    INTEREST_INCOME: 4210,
    OTHER_REVENUE: 4999
  },
  EXPENSES: {
    COST_OF_GOODS_SOLD: 5110,
    RENT_EXPENSE: 5320,
    UTILITIES: 5330,
    ADVERTISING: 5210,
    SALES_COMMISSION: 5220,
    SALARIES: 5310,
    DEPRECIATION: 5340,
    INTEREST_EXPENSE: 5410,
    CORPORATE_TAX: 5510,
    OTHER_EXPENSES: 5999,
    SERVICE_FEES: 5998  // Service fees with existing expenses
  }
} as const;

// Calculate P&L for a specific period
export async function calculateProfitLoss(
  startDate: string,
  endDate: string,
  fiscalYear?: number,
  fiscalMonth?: number
): Promise<{success: boolean, data?: PLSummary, error?: string}> {
  try {
    // Get all journal entries for the period
    const { rows: journalEntries } = await query(
      `SELECT 
         je.*,
         debit_acc.account_name_th as debit_account_name,
         credit_acc.account_name_th as credit_account_name,
         debit_acc.account_type as debit_account_type,
         credit_acc.account_type as credit_account_type
       FROM journal_entries je
       LEFT JOIN chart_of_accounts debit_acc ON je.debit_account_id = debit_acc.id
       LEFT JOIN chart_of_accounts credit_acc ON je.credit_account_id = credit_acc.id
       WHERE je.entry_date >= $1 AND je.entry_date <= $2
         AND je.is_reversed = FALSE
       ORDER BY je.entry_date, je.created_at`,
      [startDate, endDate]
    );
    
    // Initialize P&L structure
    const plSummary: PLSummary = {
      period: {
        startDate,
        endDate,
        fiscalYear: fiscalYear || new Date().getFullYear(),
        fiscalMonth: fiscalMonth || new Date().getMonth() + 1
      },
      revenue: {
        totalRevenue: 0,
        salesRevenue: 0,
        otherRevenue: 0,
        breakdown: []
      },
      expenses: {
        totalExpenses: 0,
        operatingExpenses: 0,
        costOfGoodsSold: 0,
        breakdown: []
      },
      profitability: {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0
      }
    };
    
    // Process journal entries
    const revenueMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    
    for (const entry of journalEntries) {
      const amount = parseFloat(entry.amount);
      const debitType = entry.debit_account_type;
      const creditType = entry.credit_account_type;
      
      // Revenue accounts (credits to revenue accounts)
      if (creditType === 'revenue') {
        const accountCode = entry.credit_account_id;
        const accountName = entry.credit_account_name;
        
        plSummary.revenue.totalRevenue += amount;
        revenueMap.set(accountCode, (revenueMap.get(accountCode) || 0) + amount);
        
        // Categorize revenue
        if (Number(accountCode) === COA_CATEGORIES.REVENUE.SALES_REVENUE) {
          plSummary.revenue.salesRevenue += amount;
        } else if (Number(accountCode) === COA_CATEGORIES.REVENUE.SALES_DISCOUNTS) {
          plSummary.revenue.salesRevenue -= amount; // Discounts reduce revenue
        } else if (Number(accountCode) === COA_CATEGORIES.REVENUE.INTEREST_INCOME) {
          plSummary.revenue.otherRevenue += amount;
        } else {
          plSummary.revenue.otherRevenue += amount;
        }
      }
      
      // Expense accounts (debits to expense accounts)
      if (debitType === 'expense') {
        const accountCode = entry.debit_account_id;
        const accountName = entry.debit_account_name;
        
        plSummary.expenses.totalExpenses += amount;
        expenseMap.set(accountCode, (expenseMap.get(accountCode) || 0) + amount);
        
        // Categorize expenses
        if (Number(accountCode) === COA_CATEGORIES.EXPENSES.COST_OF_GOODS_SOLD) {
          plSummary.expenses.costOfGoodsSold += amount;
        } else if (Number(accountCode) === COA_CATEGORIES.EXPENSES.RENT_EXPENSE || 
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.UTILITIES ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.ADVERTISING ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.SALES_COMMISSION ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.SALARIES ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.DEPRECIATION ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.INTEREST_EXPENSE ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.CORPORATE_TAX ||
                   Number(accountCode) === COA_CATEGORIES.EXPENSES.SERVICE_FEES) {
          plSummary.expenses.operatingExpenses += amount;
        } else {
          plSummary.expenses.operatingExpenses += amount;
        }
      }
    }
    
    // Calculate profitability
    plSummary.profitability.grossProfit = plSummary.revenue.salesRevenue - plSummary.expenses.costOfGoodsSold;
    plSummary.profitability.netProfit = plSummary.revenue.totalRevenue - plSummary.expenses.totalExpenses;
    
    // Calculate margins
    if (plSummary.revenue.totalRevenue > 0) {
      plSummary.profitability.grossMargin = (plSummary.profitability.grossProfit / plSummary.revenue.totalRevenue) * 100;
      plSummary.profitability.netMargin = (plSummary.profitability.netProfit / plSummary.revenue.totalRevenue) * 100;
    }
    
    // Create breakdown arrays
    for (const [code, amount] of revenueMap.entries()) {
      const accountName = await getAccountName(code);
      plSummary.revenue.breakdown.push({
        accountCode: code,
        accountName,
        amount,
        percentage: plSummary.revenue.totalRevenue > 0 ? (amount / plSummary.revenue.totalRevenue) * 100 : 0
      });
    }
    
    for (const [code, amount] of expenseMap.entries()) {
      const accountName = await getAccountName(code);
      let category = 'Operating Expenses';
      
      if (Number(code) === COA_CATEGORIES.EXPENSES.COST_OF_GOODS_SOLD) {
        category = 'Cost of Goods Sold';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.RENT_EXPENSE) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.UTILITIES) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.ADVERTISING) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.SALES_COMMISSION) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.SALARIES) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.DEPRECIATION) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.INTEREST_EXPENSE) {
        category = 'Operating Expenses';
      } else if (Number(code) === COA_CATEGORIES.EXPENSES.CORPORATE_TAX) {
        category = 'Non-Operating Expenses';
      }
      
      plSummary.expenses.breakdown.push({
        accountCode: code,
        accountName,
        amount,
        percentage: plSummary.expenses.totalExpenses > 0 ? (amount / plSummary.expenses.totalExpenses) * 100 : 0,
        category
      });
    }
    
    return {
      success: true,
      data: plSummary
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `P&L calculation failed: ${error.message}`
    };
  }
}

// Helper function to get account name
async function getAccountName(accountCode: string): Promise<string> {
  try {
    const { rows } = await query(
      'SELECT account_name_th FROM chart_of_accounts WHERE id = $1',
      [accountCode]
    );
    return rows[0]?.account_name_th || `Account ${accountCode}`;
  } catch (error) {
    return `Account ${accountCode}`;
  }
}

// Calculate P&L for current month
export async function getCurrentMonthPL(): Promise<{success: boolean, data?: PLSummary, error?: string}> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return calculateProfitLoss(startDate, endDate, now.getFullYear(), now.getMonth() + 1);
}

// Calculate P&L for fiscal year
export async function getFiscalYearPL(fiscalYear: number): Promise<{success: boolean, data?: PLSummary, error?: string}> {
  const startDate = `${fiscalYear}-01-01`;
  const endDate = `${fiscalYear}-12-31`;
  
  return calculateProfitLoss(startDate, endDate, fiscalYear, undefined);
}

// Generate P&L report data for charts
export async function getPLChartData(
  months: number = 12
): Promise<{success: boolean, data?: any[], error?: string}> {
  try {
    const chartData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const plResult = await calculateProfitLoss(startDate, endDate);
      
      if (plResult.success && plResult.data) {
        chartData.push({
          month: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: plResult.data.revenue.totalRevenue,
          expenses: plResult.data.expenses.totalExpenses,
          profit: plResult.data.profitability.netProfit,
          margin: plResult.data.profitability.netMargin
        });
      }
    }
    
    return {
      success: true,
      data: chartData.reverse() // Most recent first
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export P&L to Excel format (future enhancement)
export async function exportPLToExcel(
  startDate: string,
  endDate: string
): Promise<{success: boolean, data?: Buffer, error?: string}> {
  try {
    const plResult = await calculateProfitLoss(startDate, endDate);
    
    if (!plResult.success || !plResult.data) {
      return {
        success: false,
        error: 'Failed to generate P&L data'
      };
    }
    
    const pl = plResult.data;
    
    // Create CSV content (simplified for now)
    let csvContent = 'Profit & Loss Statement\n';
    csvContent += `Period: ${startDate} to ${endDate}\n`;
    csvContent += `Fiscal Year: ${pl.period.fiscalYear}\n`;
    csvContent += `Fiscal Month: ${pl.period.fiscalMonth}\n\n`;
    
    csvContent += 'Revenue,\n';
    csvContent += `Total Revenue,฿${pl.revenue.totalRevenue.toFixed(2)}\n`;
    csvContent += `Sales Revenue,฿${pl.revenue.salesRevenue.toFixed(2)}\n`;
    csvContent += `Other Revenue,฿${pl.revenue.otherRevenue.toFixed(2)}\n\n`;
    
    csvContent += 'Expenses,\n';
    csvContent += `Total Expenses,฿${pl.expenses.totalExpenses.toFixed(2)}\n`;
    csvContent += `Cost of Goods Sold,฿${pl.expenses.costOfGoodsSold.toFixed(2)}\n`;
    csvContent += `Operating Expenses,฿${pl.expenses.operatingExpenses.toFixed(2)}\n\n`;
    
    csvContent += 'Profitability,\n';
    csvContent += `Gross Profit,฿${pl.profitability.grossProfit.toFixed(2)}\n`;
    csvContent += `Net Profit,฿${pl.profitability.netProfit.toFixed(2)}\n`;
    csvContent += `Gross Margin,${pl.profitability.grossMargin.toFixed(2)}%\n`;
    csvContent += `Net Margin,${pl.profitability.netMargin.toFixed(2)}%\n`;
    
    const buffer = Buffer.from(csvContent, 'utf8');
    
    return {
      success: true,
      data: buffer
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
