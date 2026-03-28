const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1 // Only need 1 connection
});

async function dumpSchema() {
  let client;
  try {
    console.log("Connecting to database...");
    client = await pool.connect();
    
    // Get all tables in the public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesRes = await client.query(tablesQuery);
    const tables = tablesRes.rows;
    
    let schemaDoc = "# Database Schema Index\n\n";
    schemaDoc += "This document contains the exact database schema as extracted from the live PostgreSQL database.\n\n";
    
    for (const table of tables) {
      const tableName = table.table_name;
      schemaDoc += `## Table: \`${tableName}\`\n\n`;
      schemaDoc += "| Column Name | Data Type | Default Value | Is Nullable |\n";
      schemaDoc += "| :--- | :--- | :--- | :--- |\n";
      
      const columnsQuery = `
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const colsRes = await client.query(columnsQuery, [tableName]);
      
      for (const col of colsRes.rows) {
        schemaDoc += `| ${col.column_name} | ${col.data_type} | ${col.column_default || 'NULL'} | ${col.is_nullable} |\n`;
      }
      
      schemaDoc += "\n";
    }
    
    const outputPath = path.join(__dirname, 'db_schema_index.md');
    fs.writeFileSync(outputPath, schemaDoc);
    console.log(`Schema successfully written to ${outputPath}`);
    
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

dumpSchema();
