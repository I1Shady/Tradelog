import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'tradelog',
  password: 'admin',
  database: 'tradelog',
});

pool.on('error', (err) => {
  console.error('DB error:', err);
});