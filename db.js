// Database access. Production uses a hosted PostgreSQL database (DATABASE_URL).
// For local testing without any account, set PGLITE_DIR (or PGLITE_DIR=memory) to use a built in Postgres.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  tg_id TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  phone TEXT,
  business_name TEXT,
  lang TEXT DEFAULT 'en',
  created_at BIGINT
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT,
  unit TEXT,
  image TEXT,
  moq INTEGER NOT NULL,
  max_qty INTEGER NOT NULL DEFAULT 0,
  tiers TEXT NOT NULL,
  lead_time TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at BIGINT,
  updated_at BIGINT
);
CREATE TABLE IF NOT EXISTS bulk_orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  tg_id TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  receipt TEXT,
  reject_note TEXT,
  eta_text TEXT,
  note TEXT,
  created_at BIGINT,
  updated_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_user ON bulk_orders(tg_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- product photos and payment receipts are stored here, because free hosts have no permanent disk
CREATE TABLE IF NOT EXISTS files (
  name TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at BIGINT
);
`;

// write "?" in queries, they are turned into $1, $2 ...
const numbered = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

async function connect() {
  let query, exec;
  if (process.env.DATABASE_URL) {
    const pg = require('pg');
    pg.types.setTypeParser(20, (v) => Number(v)); // BIGINT and COUNT come back as numbers
    const url = process.env.DATABASE_URL;
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || /sslmode=disable/.test(url);
    const pool = new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 20000, ssl: local ? false : { rejectUnauthorized: false } });
    pool.on('error', (e) => console.error('database connection error:', e.message));
    query = async (sql, params) => {
      const r = await pool.query(sql, params);
      return { rows: r.rows, rowCount: r.rowCount };
    };
    exec = (sql) => pool.query(sql);
  } else if (process.env.PGLITE_DIR) {
    const { PGlite } = require('@electric-sql/pglite');
    const pg = process.env.PGLITE_DIR === 'memory' ? new PGlite() : new PGlite(process.env.PGLITE_DIR);
    query = async (sql, params) => {
      const r = await pg.query(sql, params);
      return { rows: r.rows, rowCount: r.affectedRows !== undefined ? r.affectedRows : r.rows.length };
    };
    exec = (sql) => pg.exec(sql);
    console.log('Using the built in test database (PGLITE_DIR). Set DATABASE_URL for production.');
  } else {
    throw new Error('DATABASE_URL is not set. Add the PostgreSQL connection string to the environment variables.');
  }

  const db = {
    get: async (sql, ...p) => (await query(numbered(sql), p)).rows[0],
    all: async (sql, ...p) => (await query(numbered(sql), p)).rows,
    run: async (sql, ...p) => (await query(numbered(sql), p)).rowCount,
    insert: async (sql, ...p) => (await query(numbered(sql) + ' RETURNING id', p)).rows[0].id,
  };
  await exec(SCHEMA);
  return db;
}

module.exports = { connect };
