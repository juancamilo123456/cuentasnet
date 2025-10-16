// src/tokenStore.cjs
// Versión sin base de datos: usa variables de entorno + cache en memoria
// y (opcional) un archivo temporal en /tmp para sobrevivir reinicios.

const fs = require("fs");
const path = "/tmp/gmail_token.json";

let mem = {
  access_token: process.env.GMAIL_ACCESS_TOKEN || null,
  refresh_token: process.env.GMAIL_REFRESH_TOKEN || null,
  expiry: Number(process.env.GMAIL_TOKEN_EXPIRY || 0),
};

// Lee archivo /tmp si existe (opcional, por si Render reinicia el proceso)
try {
  if (fs.existsSync(path)) {
    const j = JSON.parse(fs.readFileSync(path, "utf8"));
    mem = {
      access_token: j.access_token || mem.access_token,
      refresh_token: j.refresh_token || mem.refresh_token,
      expiry: Number(j.expiry || mem.expiry || 0),
    };
  }
} catch { /* ignore */ }

// === API pública (mantiene nombres) ===
async function loadAnyToken() {
  // Prioriza env para el refresh_token (es lo único imprescindible)
  const refresh = process.env.GMAIL_REFRESH_TOKEN || mem.refresh_token || null;

  return {
    access_token: process.env.GMAIL_ACCESS_TOKEN || mem.access_token || null,
    refresh_token: refresh,                               // <-- necesario
    expiry: Number(process.env.GMAIL_TOKEN_EXPIRY || mem.expiry || 0),
  };
}

async function saveToken({ sub, email, access_token, refresh_token, expiry }) {
  // `sub` y `email` se ignoran aquí (ya no persistimos por usuario)
  mem.access_token = access_token || null;
  mem.refresh_token = refresh_token || mem.refresh_token || null;
  mem.expiry = Number(expiry || 0);

  // Refleja en process.env para que otros módulos lo lean sin estado
  process.env.GMAIL_ACCESS_TOKEN = mem.access_token || "";
  process.env.GMAIL_TOKEN_EXPIRY = String(mem.expiry || 0);
  if (refresh_token) process.env.GMAIL_REFRESH_TOKEN = refresh_token;

  // Guardado opcional en /tmp (sobrevive reinicio de proceso)
  try {
    fs.writeFileSync(
      path,
      JSON.stringify(
        {
          access_token: mem.access_token,
          refresh_token: mem.refresh_token, // no es “secreto” extra, ya está en env
          expiry: mem.expiry,
        },
        null,
        2
      )
    );
  } catch { /* ignore */ }
}

module.exports = { loadAnyToken, saveToken };
