const { query } = require('./lib/db.ts');

async function checkSchema() {
  try {
    const expensesSchema = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'expenses' ORDER BY ordinal_position");
    const journalSchema = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'journal_entries' ORDER BY ordinal_position");
    
    console.log('=== EXPENSES TABLE SCHEMA ===');
    console.log(JSON.stringify(expensesSchema.rows, null, 2));
    console.log('=== JOURNAL_ENTRIES TABLE SCHEMA ===');
    console.log(JSON.stringify(journalSchema.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Schema check error:', error);
    process.exit(1);
  }
}

checkSchema();
