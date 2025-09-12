// src/getGmail.js
const { google } = require('googleapis');
const { loadAnyToken, saveToken } = require('../tokenStore');

async function getGmail() {
  const t = await loadAnyToken();
  if (!t) throw new Error('No hay cuenta de Google vinculada aún');

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
  );

  oauth2.setCredentials({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expiry_date: t.expiry,
  });

  // refresca si faltan <60s
  if (!t.expiry || Date.now() > t.expiry - 60_000) {
    const { credentials } = await oauth2.refreshAccessToken();
    await saveToken({
      sub: t.sub,
      email: t.email,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || t.refresh_token,
      expiry: credentials.expiry_date,
    });
    oauth2.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: oauth2 });
}

module.exports = { getGmail };
