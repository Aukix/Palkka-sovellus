/**
 * Päivitysten haku ja asennus sovelluksen omalta palvelimelta (server.cjs).
 */

/* global __APP_VERSION__ */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export class LegacyServerError extends Error {}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(path, {
      ...options,
      headers: { 'X-Tyotunnit': '1', 'Content-Type': 'application/json', ...(options.headers || {}) },
      cache: 'no-store',
    });
  } catch (err) {
    throw new Error('Sovelluksen taustapalvelimeen ei saatu yhteyttä.');
  }

  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    // Vanha server.cjs ei tunne päivitystoimintoa (palauttaa sivun HTML:nä)
    throw new LegacyServerError('Päivitystoiminto otetaan käyttöön, kun sovellus käynnistetään uudelleen.');
  }
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Virhe ${res.status}`);
  return body;
}

export function checkForUpdate() {
  return api('/api/update/check');
}

export function getServerVersion() {
  return api('/api/version');
}

/** Tallentaa kaikki sovelluksen tiedot (localStorage) varmuuskopioksi sovelluskansioon. */
export function backupLocalData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('tyotunnit_')) data[key] = localStorage.getItem(key);
  }
  return api('/api/backup', { method: 'POST', body: JSON.stringify({ data }) });
}

export function installUpdate() {
  return api('/api/update/install', { method: 'POST', body: '{}' });
}

export function requestRestart() {
  return api('/api/restart', { method: 'POST', body: '{}' });
}

/** Odottaa, että uudelleen käynnistynyt palvelin vastaa annetulla versiolla. */
export async function waitForVersion(version, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 700));
    try {
      const res = await getServerVersion();
      if (res.version === version) return true;
    } catch (err) {
      // Palvelin käynnistyy vielä
    }
  }
  return false;
}
