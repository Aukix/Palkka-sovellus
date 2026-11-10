const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const APP_DIR = __dirname;
const DIST_DIR = path.join(APP_DIR, 'dist');
const PROFILE_DIR = path.join(APP_DIR, '.browser-profile');
const BACKUP_DIR = path.join(APP_DIR, 'varmuuskopiot');
const PORT = 5173;
const APP_URL = `http://127.0.0.1:${PORT}/`;

// Päivitykset haetaan GitHubin main-haarasta (testeissä osoitteet voi ohittaa ympäristömuuttujilla)
const REPO = 'Aukix/Palkka-sovellus';
const VERSION_URL = process.env.TYOTUNNIT_VERSION_URL || `https://raw.githubusercontent.com/${REPO}/main/package.json`;
const ZIP_URL = process.env.TYOTUNNIT_ZIP_URL || `https://github.com/${REPO}/archive/refs/heads/main.zip`;

// Näitä kansioita päivitys ei koskaan kopioi eikä muuta: tallennetut tunnit ja varmuuskopiot
const PROTECTED_NAMES = new Set(['.browser-profile', 'varmuuskopiot', 'node_modules', '.git']);
const MAX_BACKUPS = 30;

const IS_RESTART = process.env.TYOTUNNIT_RESTART === '1';
const NO_BROWSER = process.env.TYOTUNNIT_NO_BROWSER === '1';

let appProc = null;
let restartPending = false;
let updateInProgress = false;

// ---------------------------------------------------------------------------
// Selaimen etsiminen ja avaaminen
// ---------------------------------------------------------------------------

/** Lukee selaimen polun Windowsin rekisterin App Paths -avaimesta. */
function findFromRegistry(exeName) {
  if (process.platform !== 'win32') return null;
  const roots = ['HKLM', 'HKCU'];
  for (const root of roots) {
    try {
      const out = execFileSync('reg', [
        'query',
        `${root}\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`,
        '/ve'
      ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = out.match(/REG_SZ\s+(.+)/);
      if (match) {
        const exePath = match[1].trim().replace(/^"|"$/g, '');
        if (fs.existsSync(exePath)) return exePath;
      }
    } catch (err) {
      // Avainta ei löytynyt, kokeillaan seuraavaa
    }
  }
  return null;
}

/** Etsii Edgen tai Chromen, joilla sovellus aukeaa omaan ikkunaansa. */
function findAppBrowser() {
  if (process.platform !== 'win32') return null;
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const local = process.env['LOCALAPPDATA'] || '';

  const candidates = [
    path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe'),
    local && path.join(local, 'Microsoft\\Edge\\Application\\msedge.exe'),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }

  const edgeFromRegistry = findFromRegistry('msedge.exe');
  if (edgeFromRegistry) return edgeFromRegistry;

  const chromeCandidates = [
    path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'),
    local && path.join(local, 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  for (const p of chromeCandidates) {
    if (p && fs.existsSync(p)) return p;
  }

  return findFromRegistry('chrome.exe');
}

function appWindowArgs() {
  return [
    `--app=${APP_URL}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check'
  ];
}

/** Avaa osoitteen koneen oletusselaimeen. */
function openInDefaultBrowser() {
  console.log(`[Työtunnit] Avataan sovellus oletusselaimeen: ${APP_URL}`);
  console.log('[Työtunnit] Pidä tämä ikkuna auki sovelluksen käytön ajan. Sulje ikkuna, kun lopetat.');
  const fail = () => console.error(`[Työtunnit] Selaimen avaus ei onnistunut. Avaa selaimessa: ${APP_URL}`);
  try {
    const proc = spawn('cmd', ['/c', 'start', '""', APP_URL], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true });
    proc.on('error', fail);
    proc.unref();
  } catch (err) {
    fail();
  }
}

// ---------------------------------------------------------------------------
// Versiot ja päivitys
// ---------------------------------------------------------------------------

function readLocalVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(APP_DIR, 'package.json'), 'utf8')).version || '0.0.0';
  } catch (err) {
    return '0.0.0';
  }
}

/** Palauttaa >0 jos a on uudempi kuin b, <0 jos vanhempi, 0 jos sama. */
function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** fetch, joka antaa ymmärrettävän virheen, jos verkkoyhteyttä ei ole. */
async function fetchOnline(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error('Ei yhteyttä GitHubiin.');
  }
}

async function fetchLatestVersion() {
  const res = await fetchOnline(`${VERSION_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Tyotunnit-paivitys', 'Cache-Control': 'no-cache' }
  });
  if (!res.ok) throw new Error(`GitHub vastasi virheellä ${res.status}.`);
  const pkg = await res.json();
  if (!pkg.version) throw new Error('Versiotietoa ei löytynyt.');
  return pkg.version;
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'ignore', windowsHide: true });
    proc.on('error', reject);
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} päättyi koodiin ${code}`))));
  });
}

async function extractZip(zipPath, destDir) {
  if (process.platform === 'win32') {
    try {
      // Windows 10/11:n oma tar osaa purkaa zip-tiedostot
      await runCommand('tar', ['-xf', zipPath, '-C', destDir]);
      return;
    } catch (err) {
      const q = (s) => `'${s.replace(/'/g, "''")}'`;
      await runCommand('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
        `Expand-Archive -LiteralPath ${q(zipPath)} -DestinationPath ${q(destDir)} -Force`
      ]);
      return;
    }
  }
  await runCommand('unzip', ['-q', '-o', zipPath, '-d', destDir]);
}

/** Kopioi kansion sisällön; suojattuihin kansioihin ei kosketa. */
function copyTree(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (PROTECTED_NAMES.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyTree(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

/** Poistaa vanhan käännöksen tiedostot, joita uudessa versiossa ei enää ole. */
function pruneOldAssets(newRoot) {
  const oldAssets = path.join(DIST_DIR, 'assets');
  const newAssets = path.join(newRoot, 'dist', 'assets');
  if (!fs.existsSync(oldAssets) || !fs.existsSync(newAssets)) return;
  const keep = new Set(fs.readdirSync(newAssets));
  for (const name of fs.readdirSync(oldAssets)) {
    if (!keep.has(name)) fs.rmSync(path.join(oldAssets, name), { force: true, recursive: true });
  }
}

async function installUpdate() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tyotunnit-paivitys-'));
  try {
    console.log('[Työtunnit] Ladataan päivitys...');
    const res = await fetchOnline(ZIP_URL, { headers: { 'User-Agent': 'Tyotunnit-paivitys' } });
    if (!res.ok) throw new Error(`Lataus epäonnistui (${res.status}).`);
    const zipPath = path.join(tmp, 'paivitys.zip');
    fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));

    const outDir = path.join(tmp, 'pura');
    fs.mkdirSync(outDir);
    await extractZip(zipPath, outDir);

    const candidates = [outDir, ...fs.readdirSync(outDir).map((n) => path.join(outDir, n))];
    const root = candidates.find((dir) =>
      fs.existsSync(path.join(dir, 'server.cjs')) &&
      fs.existsSync(path.join(dir, 'package.json')) &&
      fs.existsSync(path.join(dir, 'dist', 'index.html'))
    );
    if (!root) throw new Error('Ladattu paketti ei näytä Työtunnit-sovellukselta.');

    const newVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    console.log(`[Työtunnit] Asennetaan versio ${newVersion}...`);
    copyTree(root, APP_DIR);
    pruneOldAssets(root);
    return newVersion;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function saveBackup(data) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(BACKUP_DIR, `tyotunnit_${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), version: readLocalVersion(), data }, null, 2));

  // Säilytetään uusimmat varmuuskopiot
  const files = fs.readdirSync(BACKUP_DIR).filter((n) => n.startsWith('tyotunnit_') && n.endsWith('.json')).sort();
  files.slice(0, Math.max(0, files.length - MAX_BACKUPS)).forEach((n) => fs.rmSync(path.join(BACKUP_DIR, n), { force: true }));
  return file;
}

/** Käynnistää sovelluksen uudelleen omana prosessinaan ja sulkee tämän. */
function relaunchAndExit(extraEnv = {}) {
  console.log('[Työtunnit] Käynnistetään sovellus uudelleen...');
  const child = spawn(process.execPath, [path.join(APP_DIR, 'server.cjs')], {
    cwd: APP_DIR,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, TYOTUNNIT_RESTART: '1', ...extraEnv }
  });
  child.unref();
  setTimeout(() => process.exit(0), 300);
}

// ---------------------------------------------------------------------------
// HTTP-palvelin
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Liian suuri pyyntö'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch (err) {
        reject(new Error('Virheellinen JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  // Vain sovellus itse saa käyttää rajapintaa (muut sivustot eivät voi lähettää tätä otsaketta)
  if (req.headers['x-tyotunnit'] !== '1') {
    sendJson(res, 403, { error: 'Kielletty' });
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/api/version') {
      sendJson(res, 200, { version: readLocalVersion() });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/update/check') {
      const current = readLocalVersion();
      const latest = await fetchLatestVersion();
      sendJson(res, 200, { current, latest, updateAvailable: compareVersions(latest, current) > 0 });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/backup') {
      const body = await readJsonBody(req);
      const file = saveBackup(body.data || {});
      sendJson(res, 200, { ok: true, file: path.relative(APP_DIR, file) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/update/install') {
      if (updateInProgress) {
        sendJson(res, 409, { error: 'Päivitys on jo käynnissä' });
        return;
      }
      updateInProgress = true;
      try {
        const version = await installUpdate();
        sendJson(res, 200, { ok: true, version });
      } finally {
        updateInProgress = false;
      }
      return;
    }

    if (req.method === 'POST' && pathname === '/api/restart') {
      if (appProc && appProc.exitCode === null) {
        // Sovellusikkuna suljetaan sivulta käsin, jotta selain ehtii tallentaa tiedot.
        // Kun ikkuna on sulkeutunut, sovellus käynnistyy uudelleen (ks. appProc 'exit').
        restartPending = true;
        sendJson(res, 200, { mode: 'window' });
      } else {
        // Oletusselaintila: palvelin käynnistyy uudelleen ja sivu latautuu itse
        sendJson(res, 200, { mode: 'reload' });
        setTimeout(() => relaunchAndExit({ TYOTUNNIT_NO_BROWSER: '1' }), 200);
      }
      return;
    }

    sendJson(res, 404, { error: 'Tuntematon toiminto' });
  } catch (err) {
    console.error('[Työtunnit] Virhe:', err.message);
    sendJson(res, 500, { error: err.message });
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(req.url.split('?')[0]);
  } catch (err) {
    pathname = '/';
  }

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath === '\\' || safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const headers = { 'Content-Type': contentType };
  // index.html ei saa jäädä välimuistiin, jotta päivitetty versio latautuu heti
  if (ext === '.html') headers['Cache-Control'] = 'no-store';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Virhe tiedostoa ladattaessa');
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
});

function openAppWindow() {
  const browser = findAppBrowser();
  if (!browser) {
    console.log('[Työtunnit] Edgeä tai Chromea ei löytynyt.');
    openInDefaultBrowser();
    return;
  }

  appProc = spawn(browser, appWindowArgs(), { detached: false, stdio: 'ignore' });

  appProc.on('exit', () => {
    if (restartPending) {
      relaunchAndExit();
      return;
    }
    console.log('[Työtunnit] Ikkuna suljettu. Sammutetaan palvelin...');
    process.exit(0);
  });

  appProc.on('error', (err) => {
    console.error(`[Työtunnit] Selaimen käynnistys epäonnistui (${err.code}).`);
    appProc = null;
    openInDefaultBrowser();
  });
}

let listenAttempts = 0;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && IS_RESTART && listenAttempts < 50) {
    // Uudelleenkäynnistys: odotetaan, että edellinen versio vapauttaa portin
    listenAttempts++;
    setTimeout(() => server.listen(PORT, '127.0.0.1'), 200);
    return;
  }
  if (err.code === 'EADDRINUSE') {
    // Sovellus on jo käynnissä (esim. edellinen kerta jäi päälle): avataan se.
    console.log('[Työtunnit] Sovellus on jo käynnissä, avataan ikkuna.');
    const browser = findAppBrowser();
    if (browser) {
      const proc = spawn(browser, appWindowArgs(), { detached: true, stdio: 'ignore' });
      proc.on('error', openInDefaultBrowser);
      proc.unref();
    } else {
      openInDefaultBrowser();
    }
    setTimeout(() => process.exit(0), 500);
    return;
  }
  console.error('[Työtunnit] Palvelinvirhe:', err);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Työtunnit] Sovellus käynnissä osoitteessa ${APP_URL} (versio ${readLocalVersion()})`);
  if (NO_BROWSER) return;
  openAppWindow();
});
