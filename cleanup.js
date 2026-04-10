const { query } = require('./lib/db.js');
async function cleanup() {
  try {
    await query('DROP TABLE IF EXISTS items;');
    console.log('Successfully dropped items table.');
  } catch (e) {
    console.error(e);
  }
}
cleanup();
