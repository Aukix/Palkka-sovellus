const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const PROFILE_DIR = path.join(__dirname, '.browser-profile');
const PORT = 5173;

function getEdgePath() {
  const possiblePaths = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return 'msedge.exe';
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
  let safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath === '\\' || safePath === '/' ? 'index.html' : safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Työtunnit] Sovellus käynnissä osoitteessa http://localhost:${PORT}/`);

  const edgeExe = getEdgePath();
  const edgeArgs = [
    `--app=http://127.0.0.1:${PORT}/`,
    `--user-data-dir=${PROFILE_DIR}`,
    `--no-first-run`,
    `--no-default-browser-check`
  ];

  const appProc = spawn(edgeExe, edgeArgs, {
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
    console.error('Virhe selaimen käynnistyksessä:', err);
  });
});
