import { query } from '../lib/db';

async function addContactIdColumn() {
  try {
    console.log('Checking if contact_id column exists in quotations table...');
    
    // Check if column exists
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations' AND column_name = 'contact_id'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('contact_id column does not exist. Adding it...');
      
      // Add the column
      await query(`ALTER TABLE quotations ADD COLUMN contact_id INTEGER REFERENCES contacts(id)`);
      console.log('contact_id column added successfully!');
    } else {
      console.log('contact_id column already exists.');
    }
    
    // Show current columns
    const columnsResult = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quotations' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current quotations table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error adding contact_id column:', error);
  }
}

addContactIdColumn();
