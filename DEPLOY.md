# Deploy Soqi POS (PostgreSQL + Vercel)

This app uses **PostgreSQL** (not SQLite) so it works on the public internet.

## 1) Create a free Postgres database (Neon)

1. Open [https://console.neon.tech](https://console.neon.tech) and sign up (GitHub works).
2. Create a project (e.g. `soqi-pos`).
3. Copy the connection string (**Connection string** → Prisma / Node).
4. It looks like:

```text
postgresql://USER:PASSWORD@ep-xxxxx.REGION.aws.neon.tech/neondb?sslmode=require
```

## 2) Configure local `.env`

```bash
cp .env.example .env
```

Put your Neon URL into `.env`:

```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-a-long-random-secret-here"
```

Generate a secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

## 3) Create tables + seed demo data

```bash
npx prisma db push
npm run db:seed
```

Then run locally:

```bash
npm run dev
```

## 4) Deploy to Vercel (public URL like youtube.com)

1. Push this repo to GitHub (already: `omerpirot7/soqi-pos`).
2. Go to [https://vercel.com](https://vercel.com) → **Add New Project** → import `soqi-pos`.
3. In **Environment Variables**, add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | same Neon Postgres URL |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` (update after first deploy) |
| `NEXTAUTH_SECRET` | same long secret as local |

4. Deploy. After the first URL appears, set `NEXTAUTH_URL` to that `https://...vercel.app` and redeploy.
5. Optional: buy a domain (e.g. `soqi.com`) and attach it in Vercel → Domains.

## Demo logins (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@store.local` | `admin123` |
| Cashier | `cashier@store.local` | `cashier123` |
| Warehouse | `warehouse@store.local` | `warehouse123` |

## Notes

- SQLite (`file:./dev.db`) is no longer used — cloud hosts wipe local files.
- `npm run db:push` and `db:seed` against your Neon URL update the **cloud** database (shared by local + production if you use the same URL).
- For production-only data, create a second Neon branch/database and use that URL only on Vercel.
