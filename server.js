const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fileURLToPath } = require('node:url');
const Database = require('better-sqlite3');

const PORT = Number(process.env.PORT) || 3000;
const root = __dirname;
const databaseUrl = process.env.DATABASE_URL || '';
const databasePath = databaseUrl.startsWith('file:')
  ? fileURLToPath(databaseUrl)
  : databaseUrl || path.join(root, 'hoplog.db');
const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = storedHash.split(':');
  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function isValidEmail(email) {
  const atIndex = email.indexOf('@');
  const domain = email.slice(atIndex + 1);
  return atIndex > 0 && domain.includes('.') && !email.includes(' ');
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; if (body.length > 10000) reject(new Error('Request too large')); });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    request.on('error', reject);
  });
}

async function handleAuth(request, response, mode) {
  try {
    const { email, password } = await readJson(request);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(normalizedEmail) || typeof password !== 'string' || password.length < 6) {
      return sendJson(response, 400, { error: 'Enter a valid email and a password with at least 6 characters.' });
    }
    const findUser = database.prepare('SELECT email, password_hash FROM users WHERE email = ?');
    const existingUser = findUser.get(normalizedEmail);
    if (mode === 'register') {
      if (existingUser) return sendJson(response, 409, { error: 'That account already exists. Try logging in.' });
      database.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(normalizedEmail, hashPassword(password));
    } else if (!existingUser || !verifyPassword(password, existingUser.password_hash)) {
      return sendJson(response, 401, { error: 'Email or password is incorrect.' });
    }
    return sendJson(response, 200, { email: normalizedEmail });
  } catch (error) {
    return sendJson(response, 400, { error: error.message === 'Request too large' ? error.message : 'Unable to process that request.' });
  }
}

const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    return response.end();
  }
  if (request.method === 'POST' && requestUrl.pathname === '/api/register') return handleAuth(request, response, 'register');
  if (request.method === 'POST' && requestUrl.pathname === '/api/login') return handleAuth(request, response, 'login');
  if (request.method !== 'GET') return sendJson(response, 405, { error: 'Method not allowed.' });

  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.normalize(path.join(root, requestedPath));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404); return response.end('Not found');
  }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(PORT, '0.0.0.0', () => console.log(`Hoplog running on port ${PORT}`));
