import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    console.log('Running migration to add recurring columns to quotations table...');
    
    // First check if table exists
    const tableCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'quotations'
    `);
    
    if (tableCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Quotations table does not exist' }, { status: 404 });
    }
    
    console.log('✅ Found quotations table');
    
    // Add is_recurring column
    try {
      await query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE`);
      console.log('✅ Added is_recurring column');
    } catch (err: any) {
      console.log('⚠️  is_recurring column:', err.message);
    }
    
    // Add recurring_interval column  
    try {
      await query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20) DEFAULT 'none'`);
      console.log('✅ Added recurring_interval column');
    } catch (err: any) {
      console.log('⚠️  recurring_interval column:', err.message);
    }
    
    // Verify the columns were added
    const result = await query(
      `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'quotations' AND column_name IN ('is_recurring', 'recurring_interval') ORDER BY column_name`
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      columns: result.rows 
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}
