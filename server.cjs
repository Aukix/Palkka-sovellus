const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const PROFILE_DIR = path.join(__dirname, '.browser-profile');
const PORT = 5173;
const APP_URL = `http://127.0.0.1:${PORT}/`;

/** Lukee selaimen polun Windowsin rekisterin App Paths -avaimesta. */
function findFromRegistry(exeName) {
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
  let safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath === '\\' || safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Virhe tiedostoa ladattaessa');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Sovellus on jo käynnissä (esim. edellinen kerta jäi päälle): avataan se.
    console.log('[Työtunnit] Sovellus on jo käynnissä, avataan ikkuna.');
    const browser = findAppBrowser();
    if (browser) {
      const proc = spawn(browser, [`--app=${APP_URL}`, `--user-data-dir=${PROFILE_DIR}`, '--no-first-run', '--no-default-browser-check'], {
        detached: true,
        stdio: 'ignore'
      });
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
  console.log(`[Työtunnit] Sovellus käynnissä osoitteessa ${APP_URL}`);

  const browser = findAppBrowser();
  if (!browser) {
    console.log('[Työtunnit] Edgeä tai Chromea ei löytynyt.');
    openInDefaultBrowser();
    return;
  }

  const appProc = spawn(browser, [
    `--app=${APP_URL}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check'
  ], {
    detached: false,
    stdio: 'ignore'
  });

  appProc.on('exit', () => {
    console.log('[Työtunnit] Ikkuna suljettu. Sammutetaan palvelin...');
    server.close(() => {
      process.exit(0);
    });
  });

  appProc.on('error', (err) => {
    console.error(`[Työtunnit] Selaimen käynnistys epäonnistui (${err.code}).`);
    openInDefaultBrowser();
  });
});
