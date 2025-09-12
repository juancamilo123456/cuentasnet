// src/tokenStore.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_tokens (
      sub TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT NOT NULL,
      expiry BIGINT NOT NULL
    );
  `);
})().catch(console.error);

async function loadAnyToken() {
  const { rows } = await pool.query('SELECT * FROM google_tokens LIMIT 1');
  return rows[0] || null;
}

async function saveToken({ sub, email, access_token, refresh_token, expiry }) {
  await pool.query(
    `INSERT INTO google_tokens (sub,email,access_token,refresh_token,expiry)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (sub) DO UPDATE SET
       email=EXCLUDED.email,
       access_token=EXCLUDED.access_token,
       refresh_token=EXCLUDED.refresh_token,
       expiry=EXCLUDED.expiry`,
    [sub, email, access_token, refresh_token, expiry]
  );
}

module.exports = { loadAnyToken, saveToken };
