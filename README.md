# Hoplog

Hoplog is a beer tasting journal with SQLite-backed account registration and login.

## Run locally

```powershell
npm.cmd install
npm.cmd start
```

Open <http://localhost:3000>.

Use the URL printed by `npm.cmd start`. Do not open `index.html` directly or use a static web server such as Live Server, because account registration and login require the Node API at `/api/register` and `/api/login`.

To enable the **Forgot your password?** option, set a private reset token before starting the server. Give this token only to trusted users who need to reset an account:

```bash
PASSWORD_RESET_TOKEN='replace-with-a-long-random-secret' npm start
```

On Windows PowerShell:

```powershell
$env:PASSWORD_RESET_TOKEN = 'replace-with-a-long-random-secret'
npm.cmd start
```

If port `3000` is already in use, stop the other Hoplog process or choose another port:

```bash
PORT=3001 npm start
```

On Windows PowerShell, use:

```powershell
$env:PORT = 3001
npm.cmd start
```

The server creates `hoplog.db` in the project folder. Passwords are stored as salted `scrypt` hashes. The database files are excluded from Git by `.gitignore`.

## Hosting

This app cannot use database login when deployed to a static-only host such as GitHub Pages. Deploy the whole project to a Node.js host instead, with:

- Build/install command: `npm install`
- Start command: `npm start`
- A persistent disk mounted for `hoplog.db`
- The host's `PORT` environment variable passed to the app

### Linux deployment

Install dependencies on the Linux server. Do not copy `node_modules` from Windows or another operating system, because `better-sqlite3` contains a platform-specific native binary.

```bash
cd /var/www/html
rm -rf node_modules
npm ci
npm start
```

If the server already has the source code and build tools installed but the native module still fails to load, rebuild it on that server:

```bash
npm rebuild better-sqlite3 --build-from-source
npm start
```

For Docker, build the image from this project directory. The included `.dockerignore` excludes local `node_modules`, and the Dockerfile installs the Linux dependencies inside the image.

```bash
docker build -t hoplog .
docker run -p 3000:3000 -v hoplog-data:/data hoplog
```

The frontend and API are served by the same Node process, so no API URL configuration is needed when deployed this way. Do not commit `hoplog.db` because it contains account records.
