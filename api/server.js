// api/server.js — Gmail + Netflix classifier + Latest Mail
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';

const app = express();

/* ================== Config ================== */
const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const TOKEN_PATH = path.join(process.cwd(), '.token.json');

const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;
if (!REDIRECT_URI) {
  console.error('❌ Falta OAUTH_REDIRECT_URI en .env');
  process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env');
  process.exit(1);
}

// Auto-confirm hogar (opcional)
const AUTO_CONFIRM_HOME = process.env.AUTO_CONFIRM_HOME === '1';
const NETFLIX_CONFIRM_HOME_URL = process.env.NETFLIX_CONFIRM_HOME_URL || '';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: false }));
app.use(express.json());

/* ================ OAuth2 ================= */
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// guarda tokens refrescados para que no caduque el access_token
oAuth2Client.on('tokens', (tokens) => {
  try {
    const current = hasToken() ? JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')) : {};
    const merged = { ...current, ...tokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch { /* no-op */ }
});

/* ================ Whitelist ================ */
function normalizeGmail(email) {
  let [local, domain] = String(email || '').toLowerCase().split('@');
  if (!domain) return String(email || '').toLowerCase();
  if (domain === 'gmail.com') local = local.split('+')[0].replace(/\./g, '');
  else local = local.split('+')[0];
  return `${local}@${domain}`;
}

const allowBase = process.env.ALLOW_BASE ? normalizeGmail(process.env.ALLOW_BASE) : null;
const allowExtra = (process.env.ALLOW_EXTRA || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(normalizeGmail);

function isAllowedEmail(email) {
  const n = normalizeGmail(email);
  if (allowBase && n === allowBase) return true;
  if (allowExtra.includes(n)) return true;
  if (allowBase) {
    const [bl, bd] = allowBase.split('@');
    const [l, d] = n.split('@');
    if (d === bd && l.startsWith(bl)) return true; // base+alias
  }
  return false;
}

/* ================ Token helpers ================ */
function hasToken() { return fs.existsSync(TOKEN_PATH); }
function loadToken() {
  if (!hasToken()) return null;
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf8');
    const tok = JSON.parse(raw);
    oAuth2Client.setCredentials(tok);
    return tok;
  } catch { return null; }
}
function saveToken(tok) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tok, null, 2), 'utf8');
}

/* ================ OAuth endpoints ================ */
app.get('/api/auth/status', (_req, res) => {
  res.json({ ok: true, authorized: hasToken() });
});
function handleAuthUrl(req, res) {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    include_granted_scopes: true,
    prompt: 'consent',
    scope: scopes,
    redirect_uri: REDIRECT_URI,
  });
  if ((req.headers.accept || '').includes('application/json')) return res.json({ ok: true, url });
  return res.redirect(url);
}
app.get('/api/auth', handleAuthUrl);
app.get('/api/oauth2/auth', handleAuthUrl);

app.get('/api/oauth2/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Falta "code".');
    const { tokens } = await oAuth2Client.getToken(code);
    saveToken(tokens);
    oAuth2Client.setCredentials(tokens);
    const back = FRONTEND_ORIGIN.replace(/\/$/, '');
    res.send(`<h2>✅ Autorizado.</h2><p>Ya puedes cerrar esta pestaña y volver a <a href="${back}">${back}</a>.</p>`);
  } catch (e) {
    console.error('OAuth callback error:', e);
    res.status(500).send('Error intercambiando el código OAuth.');
  }
});

// ¿Qué cuenta está autorizada?
app.get('/api/whoami', async (_req, res) => {
  try {
    if (!hasToken()) return res.status(401).json({ ok: false, error: 'No autorizado' });
    loadToken();
    const g = google.gmail({ version: 'v1', auth: oAuth2Client });
    const profile = await g.users.getProfile({ userId: 'me' });
    res.json({ ok: true, emailAddress: profile.data.emailAddress, messagesTotal: profile.data.messagesTotal });
  } catch {
    res.status(500).json({ ok: false, error: 'No se pudo obtener el perfil' });
  }
});

/* ================ Gmail helpers ================ */
function gmail() {
  loadToken();
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}
function decodeBody(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

// extrae **ambos** cuerpos (texto y HTML) recursivamente
function extractBodies(payload) {
  let plain = '';
  let html = '';
  function walk(p) {
    if (!p) return;
    if (p.mimeType === 'text/plain' && p.body?.data) plain += decodeBody(p.body.data) + '\n';
    if (p.mimeType === 'text/html'  && p.body?.data) html  += decodeBody(p.body.data)  + '\n';
    if (Array.isArray(p.parts)) p.parts.forEach(walk);
  }
  walk(payload);
  // fallback
  if (!plain && payload?.mimeType === 'text/plain' && payload?.body?.data) plain = decodeBody(payload.body.data);
  if (!html  && payload?.mimeType === 'text/html'  && payload?.body?.data) html  = decodeBody(payload.body.data);
  const combined = [plain, html].filter(Boolean).join('\n');
  return { plain, html, combined };
}

/* ================ Clasificador Netflix ================ */
function normalizeSpaces(s) {
  return String(s || '').replace(/[\u00A0\u2007\u202F]/g, ' ');
}
function findFourDigitCode(text) {
  const t = normalizeSpaces(text);
  const near = t.match(/(?:c[oó]digo|code|otp|inicio de sesi[oó]n|login|access|verify)[^0-9]{0,40}(\d(?:\D?\d){3})/i);
  if (near) return near[1].replace(/\D/g, '');
  const any = t.match(/(?<!\d)(\d)(?:\D)?(\d)(?:\D)?(\d)(?:\D)?(\d)(?!\d)/);
  if (any) return any.slice(1).join('');
  return null;
}

const RX_NETFLIX_LINK = /https?:\/\/www\.netflix\.com\/[^\s"'<>)]+/ig;
const RX_TRAVEL_PATH = /\/account\/travel\/verify/i;
const RX_HOME_PATH   = /\/account\/update-primary-location/i;

const WORDS = {
  passwordReset: /(restablece|restablecer|restablecimiento|contraseñ|password)/i,
  travel: /(estoy de viaje|acceso temporal|viaje|viajes|viajando|are you traveling|travel)/i,
  access: /(c[oó]digo de acceso temporal|c[oó]digo de acceso|inicia sesi[oó]n sin contraseñ|inicio de sesi[oó]n|sign in without a password|login code|access code)/i,
};

function classifyNetflix(subject, combinedBody) {
  const subj = String(subject || '');
  const txt  = String(combinedBody || '');
  const lc   = (subj + '\n' + txt).toLowerCase();

  // Enlaces dentro del correo
  const links = [...(txt.match(RX_NETFLIX_LINK) || [])];

  // --- HOME / HOUSEHOLD ---
  const isHomeByLink = links.some(link => {
    try { return RX_HOME_PATH.test(new URL(link).pathname + new URL(link).search); }
    catch { return false; }
  });
  const isHomeByText = /\b(actualiza(r)?\s+tu\s+hogar|hogar con netflix|update (?:your )?household|update primary location)\b/i.test(lc);
  if (isHomeByLink || isHomeByText) {
    const homeUrl = links.find(link => {
      try { const u = new URL(link); return RX_HOME_PATH.test(u.pathname + u.search); }
      catch { return false; }
    }) || null;
    return { kind: 'home_link', url: homeUrl };
  }

  // --- ACCESS TEMPORAL / TRAVEL ---
  const isTravelByLink = links.some(link => {
    try { return RX_TRAVEL_PATH.test(new URL(link).pathname + new URL(link).search); }
    catch { return false; }
  });
  const isAccessTemporalByText = /\b(c[oó]digo de acceso temporal|temporary access code)\b/i.test(lc);

  if (isTravelByLink || isAccessTemporalByText) {
    return { kind: 'access_code' }; // mostramos el HTML completo; no necesitamos extraer dígitos
  }

  // Nada de PIN, nuevo dispositivo, reset, etc.
  return { kind: 'other' };
}

// (opcional) confirmar hogar contra endpoint propio
async function confirmHome(url) {
  if (!AUTO_CONFIRM_HOME || !NETFLIX_CONFIRM_HOME_URL) {
    return { status: 'pending', message: 'Abre el enlace para confirmar el hogar' };
  }
  try {
    const form = new URLSearchParams();
    form.set('url', url);
    const resp = await fetch(NETFLIX_CONFIRM_HOME_URL, { method: 'POST', body: form })
      .then(r => r.json())
      .catch(() => ({}));
    if (resp?.status === 'ok') return { status: 'ok', message: 'Hogar actualizado' };
    if (resp?.reason === 'expired') return { status: 'expired', message: 'Enlace expirado' };
    return { status: 'failed', message: 'No se pudo actualizar el hogar' };
  } catch {
    return { status: 'failed', message: 'No se pudo actualizar el hogar' };
  }
}

/* ================ /api/mail/latest (FILTRADO) ================ */
/** Trae el mensaje más reciente del alias que sea:
 *   - "Tu código de acceso temporal" (access_code)
 *   - "Actualizar hogar" (home_link)
 * Si no hay ninguno, 404.
 */
app.post('/api/mail/latest', async (req, res) => {
  try {
    const alias = (req.body?.alias || req.body?.email || '').toLowerCase().trim();
    if (!alias) return res.status(400).json({ ok: false, error: 'Falta alias/email' });
    if (!isAllowedEmail(alias)) return res.status(403).json({ ok: false, error: 'Email no autorizado' });
    if (!hasToken()) return res.status(401).json({ ok: false, needsAuth: true });

    const g = gmail();
    const aliasFilter = `(to:"${alias}" OR deliveredto:"${alias}")`;

    // Reducimos a remitentes de Netflix para bajar ruido
    const fromNetflix =
      '(from:netflix.com OR from:account.netflix.com OR from:mailer.netflix.com OR ' +
      'from:no-reply@account.netflix.com OR from:info@account.netflix.com OR ' +
      'from:member@mailer.netflix.com OR from:accounts@netflix.com)';

    const q = [aliasFilter, fromNetflix].join(' ');

    const list = await g.users.messages.list({
      userId: 'me',
      q,
      labelIds: ['INBOX'],
      includeSpamTrash: false,
      maxResults: 50, // si necesitas buscar más atrás, podemos paginar
    });

    const msgs = list.data.messages || [];
    if (!msgs.length) {
      return res.status(404).json({ ok: false, error: 'No se encontró ningún correo para ese alias.' });
    }

    // Traemos detalles y ordenamos más reciente primero
    const details = await Promise.all(
      msgs.map(m => g.users.messages.get({ userId: 'me', id: m.id, format: 'full' }))
    );
    details.sort((a, b) => Number(b.data.internalDate || 0) - Number(a.data.internalDate || 0));

    const allowedKinds = new Set(['access_code', 'home_link']);
    let chosen = null;

    for (const d of details) {
      const full = d.data;
      const headers = full.payload?.headers || [];
      const subject = (headers.find(h => h.name === 'Subject') || {}).value || '';
      const { plain, html, combined } = extractBodies(full.payload);

      const cls = classifyNetflix(subject, combined);
      if (!allowedKinds.has(cls.kind)) continue; // ignora PIN, nuevo dispositivo, etc.

      chosen = { full, html, plain, kind: cls.kind };
      break; // el más reciente que cumple
    }

    if (!chosen) {
      return res.status(404).json({ ok: false, error: 'No hay correos de acceso temporal ni de actualizar hogar para ese alias.' });
    }

    const headers = {};
    for (const h of chosen.full.payload?.headers || []) headers[h.name] = h.value;

    return res.json({
      ok: true,
      kind: chosen.kind,
      id: chosen.full.id,
      threadId: chosen.full.threadId,
      internalDate: chosen.full.internalDate,
      snippet: chosen.full.snippet,
      headers: {
        from: headers['From'],
        to: headers['To'],
        deliveredTo: headers['Delivered-To'],
        date: headers['Date'],
        subject: headers['Subject'],
      },
      html: chosen.html || null,
      text: chosen.html ? null : (chosen.plain || null),
    });
  } catch (e) {
    const ge = e?.response?.data?.error || e?.errors?.[0]?.message;
    if (ge === 'invalid_grant') {
      return res.status(401).json({ ok: false, needsAuth: true, error: 'Token caducado. Reautoriza Gmail.' });
    }
    console.error('Error /api/mail/latest:', e?.response?.data || e);
    return res.status(500).json({ ok: false, error: 'Error consultando Gmail' });
  }
});


/* ================ Start ================ */
app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});
