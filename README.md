# Hoplog

Hoplog is a beer tasting journal with SQLite-backed account registration and login.

## Run locally

```powershell
npm.cmd install
npm.cmd start
```

Open <http://localhost:3000>.

The server creates `hoplog.db` in the project folder. Passwords are stored as salted `scrypt` hashes. The database files are excluded from Git by `.gitignore`.

## Hosting

This app cannot use database login when deployed to a static-only host such as GitHub Pages. Deploy the whole project to a Node.js host instead, with:

- Build/install command: `npm install`
- Start command: `npm start`
- A persistent disk mounted for `hoplog.db`
- The host's `PORT` environment variable passed to the app

The frontend and API are served by the same Node process, so no API URL configuration is needed when deployed this way. Do not commit `hoplog.db` because it contains account records.
