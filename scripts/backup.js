// Saves a copy of all data to a folder on this computer: every table as a JSON file,
// plus the product photos and receipts as normal files.
// Run on your own computer: set DATABASE_URL (same value as on the host), then: npm run backup
const fs = require('fs');
const path = require('path');
const { connect } = require('../db');

const OUT = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

(async () => {
  const db = await connect();
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const dir = path.join(OUT, stamp);
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true });
  for (const t of ['users', 'products', 'bulk_orders', 'settings']) {
    const rows = await db.all(`SELECT * FROM ${t}`);
    fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 2));
    console.log(`${t}: ${rows.length} rows`);
  }
  const files = await db.all('SELECT name, kind FROM files');
  for (const f of files) {
    const row = await db.get('SELECT data FROM files WHERE name = ?', f.name);
    fs.mkdirSync(path.join(dir, 'files', f.kind), { recursive: true });
    fs.writeFileSync(path.join(dir, 'files', f.kind, path.basename(f.name)), Buffer.from(row.data));
  }
  console.log(`files: ${files.length}`);
  console.log(`Backup saved to ${dir}`);
  process.exit(0);
})().catch((e) => { console.error('Backup failed:', e.message); process.exit(1); });
