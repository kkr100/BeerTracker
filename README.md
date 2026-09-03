# Hoplog

Hoplog is a beer tasting journal with SQLite-backed account registration and login.

## Run locally

```powershell
npm.cmd install
npm.cmd start
```

Open <http://localhost:3000>.

Use the URL printed by `npm.cmd start`. Do not open `index.html` directly or use a static web server such as Live Server, because account registration and login require the Node API at `/api/register` and `/api/login`.

The server creates `hoplog.db` in the project folder. Passwords are stored as salted `scrypt` hashes. The database files are excluded from Git by `.gitignore`.

## Hosting

This app cannot use database login when deployed to a static-only host such as GitHub Pages. Deploy the whole project to a Node.js host instead, with:

- Build/install command: `npm install`
- Start command: `npm start`
- A persistent disk mounted for `hoplog.db`
- The host's `PORT` environment variable passed to the app

The frontend and API are served by the same Node process, so no API URL configuration is needed when deployed this way. Do not commit `hoplog.db` because it contains account records.
