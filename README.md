# Headstart Education

### Education for Children in Need | hseducation.com.au

Full-stack charity website for Headstart Education Australia Pty Ltd. React frontend + Node.js/Express backend + PostgreSQL, with Square-powered donations. Deployed on Northflank.

---

## File Structure

```
HSEducation/
│
├── Dockerfile                ← Single file — two targets: frontend & backend
├── nginx.conf                ← Nginx config (SPA routing + API proxy)
├── docker-entrypoint.sh      ← Injects PORT & BACKEND_URL into nginx at runtime
├── requirements.txt          ← All packages — frontend and backend
├── README.md                 ← This file
│
├── app.cmd                    ← One-click Windows launcher (see below)
│
├── frontend/
│   ├── .env.example           ← Optional fallback for Square IDs (normally set in the Admin Console)
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx
│       ├── index.js
│       ├── square.js           ← Loads Square config from the API at runtime + the Square SDK
│       ├── images/index.js         ← Image URLs (Unsplash CDN)
│       ├── components/
│       │   ├── GlobalStyles.jsx
│       │   ├── Nav.jsx
│       │   ├── Footer.jsx
│       │   ├── Logo.jsx
│       │   ├── Icon.jsx
│       │   ├── Modal.jsx               ← Generic popup dialog
│       │   └── SquarePaymentModal.jsx  ← Card/bank payment popup
│       └── pages/
│           ├── HomePage.jsx
│           ├── AboutPage.jsx
│           ├── ProjectsPage.jsx
│           ├── ImpactPage.jsx
│           ├── DonatePage.jsx
│           ├── LegalPage.jsx
│           └── AdminPage.jsx     ← Admin console: inline login + tabbed dashboard
│
└── backend/
    ├── js/
    │   ├── .env.example          ← Copy to .env — DB, Square, admin secrets
    │   ├── server.js             ← Express API
    │   ├── db.js                 ← PostgreSQL + in-memory fallback
    │   ├── square.js             ← Square Payments client (reads credentials saved in the console)
    │   ├── bootstrapAdmin.js     ← Creates the first super admin on a brand-new install
    │   ├── package.json
    │   ├── lib/
    │   │   ├── auth.js           ← bcrypt + JWT + httpOnly cookie sessions, role checks
    │   │   ├── users.js          ← Users table data access
    │   │   └── settings.js       ← Encrypted key/value settings store (Square credentials)
    │   └── routes/
    │       ├── adminAuth.js      ← login / logout / session check / change own password
    │       ├── users.js          ← manage users and roles (super admin only)
    │       ├── squareSettings.js ← Square credentials: save / test / public config
    │       ├── donations.js      ← Charges via Square; reads are admin-only
    │       ├── programs.js       ← Reads public; writes are admin-only
    │       └── providers.js
    └── app_db/
        ├── 01_schema.sql         ← Database tables (incl. users and app_settings)
        ├── 02_seed.sql           ← Seed data
        └── 03_queries.sql        ← Admin queries
```

---

## Requirements

See `requirements.txt` for all packages.

### Frontend (`frontend/`)
| Package       | Version | Purpose                       |
|---------------|---------|-------------------------------|
| react         | 18.2.0  | UI framework                  |
| react-dom     | 18.2.0  | DOM rendering                 |
| react-scripts | 5.0.1   | Webpack/Babel build tooling   |
| ajv           | 8.17.1  | JSON schema (Node 17+ fix)    |

### Backend (`backend/js/`)
| Package  | Version | Purpose                |
|----------|---------|------------------------|
| express  | 4.18.2  | Web framework          |
| pg       | 8.11.3  | PostgreSQL client      |
| helmet   | 7.1.0   | Security headers       |
| cors     | 2.8.5   | Cross-origin requests  |
| morgan   | 1.10.0  | HTTP request logging   |
| nodemon  | 3.0.2   | Dev auto-restart       |

---

## API Endpoints

| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| GET    | `/healthz`                  | Health check           |
| GET    | `/api/programs`             | List all programs      |
| GET    | `/api/programs/:id`         | Single program         |
| POST   | `/api/programs`             | Create program         |
| PUT    | `/api/programs/:id`         | Update program         |
| DELETE | `/api/programs/:id`         | Delete program         |
| GET    | `/api/donations`            | List all donations     |
| POST   | `/api/donations`            | Submit donation        |
| GET    | `/api/donations/:id`        | Single donation        |
| PATCH  | `/api/donations/:id/status` | Update status          |
| GET    | `/api/providers`            | List payment providers |
| POST   | `/api/providers`            | Add provider           |
| PUT    | `/api/providers/:id`        | Update provider        |
| DELETE | `/api/providers/:id`        | Remove provider        |

---

## Northflank Deployment

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Headstart Education initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hseducation.git
git push -u origin main
```

---

### Step 2 — Create Project

1. Log in at **northflank.com**
2. **New Project** → name: `hs-education` → **Create**

---

### Step 3 — Create Your Neon Database

This app uses [Neon](https://neon.tech) for PostgreSQL rather than a Northflank addon — see **"Neon Database Setup"** below for the full walkthrough. In short:
1. Create a free project at [neon.tech](https://neon.tech)
2. Create a database named **`hseducation`**
3. Copy the connection string from **Connection Details** — you'll paste it into `DATABASE_URL` in Step 4 below

---

### Step 4 — Deploy Backend

1. **New Service** → **Deployment Service** → **Build from source**
2. Connect GitHub → select repo
3. **Build settings:**

   | Field           | Value        |
   |-----------------|--------------|
   | Dockerfile path | `Dockerfile` |
   | Build context   | `.`          |
   | Docker target   | `backend`    |

4. **Networking** → port `5000` → HTTP → Public **OFF**
5. **Environment variables:**
   ```
   PORT=5000
   DATABASE_URL=<your Neon connection string, database "hseducation">
   FRONTEND_URL=https://hseducation.com.au

   # Square payments — no variables needed: enter the credentials in
   # Admin Console → Square Settings after you log in (see "Square Payments Setup").

   # Admin console — see "Admin Console" below
   ADMIN_USERNAME=<choose a username>
   ADMIN_PASSWORD=<choose a strong password>
   JWT_SECRET=<long random string, e.g. `openssl rand -hex 32`>
   ```
6. **Create Service** → wait for ✅

---

### Step 5 — Apply the Database Schema

Backend service → **Shell** tab:

```bash
npm run migrate
```

This creates all the tables and seeds the starting project/provider data and your default admin login — see **"Neon Database Setup"** below for details. Safe to re-run any time; it never deletes existing data, so you can run it again after every deploy without worrying about it.

---

### Step 6 — Deploy Frontend

1. **New Service** → **Deployment Service** → **Build from source**
2. Same repo
3. **Build settings:**

   | Field           | Value        |
   |-----------------|--------------|
   | Dockerfile path | `Dockerfile` |
   | Build context   | `.`          |
   | Docker target   | `frontend`   |

4. **Networking** → port `3000` → HTTP → Public **ON** ✅
5. **Environment variables:**
   ```
   PORT=3000
   BACKEND_URL=http://<backend-internal-hostname>:5000
   ```
   > Get the backend internal hostname from: backend service → **Networking** → **Internal DNS**

6. **Create Service** → wait for ✅

---

### Step 7 — Connect Domain

1. Frontend service → **Networking** → **Add Domain**
2. Enter `hseducation.com.au` and `www.hseducation.com.au`
3. Add CNAME from Northflank to your domain registrar
4. SSL is auto-provisioned ✅

---

### Step 8 — Verify

- Website: `https://hseducation.com.au`
- API: `https://<backend-url>/healthz`

```json
{ "status": "ok", "service": "Headstart Education", "database": "postgresql" }
```

---

## Local Development

**Windows:** just double-click `app.cmd` in the project root — it installs dependencies, builds the frontend, and starts the unified server on `http://localhost:3000`. See the comments at the top of the script for details.

**macOS/Linux, or manual setup:**

```bash
# 0. Configure environment variables (one-time)
cp backend/js/.env.example backend/js/.env     # then fill in DATABASE_URL + admin/JWT secrets
# Square credentials are entered later in the Admin Console (Square Settings tab)

# Terminal 1 — Backend
cd backend/js
npm install
npm run migrate      # only needed once DATABASE_URL is set — see "Neon Database Setup" below
node server.js
# http://localhost:5000 (or PORT from .env)

# Terminal 2 — Frontend
cd frontend
npm install --legacy-peer-deps
npm start
# http://localhost:3000
```

> Without `DATABASE_URL` set, the backend falls back to an in-memory store so the app still runs — but nothing is saved between restarts, and the Admin Console's **Database Tables** tab won't work. Set up Neon (below) to store data permanently. The Donate page also still renders without Square keys configured — it just won't be able to take a real payment and will record donations as "pending".

---

## Neon Database Setup

All data — donations, projects, payment providers, and admin accounts — is stored in PostgreSQL. [Neon](https://neon.tech) is the recommended host: it's free to start, fully managed, and needs no server to maintain.

### 1. Create your Neon database
1. Sign up at [neon.tech](https://neon.tech) and create a new project.
2. Neon creates a default database for you — rename it (or create a new one) called **`hseducation`**: in the Neon console, go to **Databases** → **New Database** → name it `hseducation`.
3. Go to **Connection Details** and copy the connection string. It looks like:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-12345.ap-southeast-2.aws.neon.tech/hseducation?sslmode=require
   ```

### 2. Configure the backend
Copy `backend/js/.env.example` to `backend/js/.env` and paste your connection string:
```
DATABASE_URL=postgresql://...your full Neon connection string.../hseducation?sslmode=require
```

### 3. Apply the schema
From `backend/js`, run:
```bash
npm run migrate
```
This creates all the tables (`donations`, `programs`, `providers`, `users`, `app_settings`, `admin_audit_log`) and seeds the starting project/provider data and your default admin login. **It's safe to run again at any time** — every statement is written to skip anything that already exists, and it never deletes data. `app.cmd` also runs this automatically on every launch if `DATABASE_URL` is set, so a Neon database stays in sync without any manual steps after the first setup.

### 4. Verify
Start the server (`node server.js` or restart `app.cmd`) — the startup log should say:
```
✅ PostgreSQL connected (Neon/DATABASE_URL) — using database
```
From here, every donation, project, and admin action is stored permanently in your `hseducation` Neon database, and the **Database Tables** tab in the Admin Console (see below) lets you browse, search, filter, and edit it directly.

---

## Square Payments Setup

The Donate page collects card or bank account details through a **secure popup** powered by the [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview). Card/bank numbers are tokenized by Square directly in the browser — this app never sees or stores raw card or bank account numbers.

### 1. Create a Square account & app
1. Sign up at [developer.squareup.com](https://developer.squareup.com/) and create an application.
2. Open the **Sandbox** tab (for testing) to get:
   - **Sandbox Application ID**
   - **Sandbox Access Token**
   - **Sandbox Location ID** (Locations → your test location)

### 2. Enter the credentials in the Admin Console
No `.env` editing or rebuild needed. Log in to the **Admin Console** as a Super Admin, open the **Square Settings** tab and fill in:

| Field | Where it comes from |
|---|---|
| **Environment** | `Sandbox` while testing, `Production` for live payments |
| **Application ID** | Square Developer Dashboard → your app (public — used by the card form) |
| **Location ID** | Square Dashboard → Locations (or click **Test Connection** to list yours and pick one) |
| **Access Token** | Square Developer Dashboard → your app → Credentials (secret) |

Click **Save Settings**. They take effect immediately — no restart. The access token is **encrypted in the database** (AES-256-GCM) and is never sent back to the browser; after saving you'll only see the last 4 characters. Leave the token field blank when saving to keep the existing one. **Test Connection** calls Square with the saved credentials and tells you if the token, environment and location line up.

Only Super Admins can see or change this tab.

> **Optional fallback:** if nothing has been saved in the console, the server still reads `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID` and `SQUARE_ENVIRONMENT` from `backend/js/.env` (and the old `REACT_APP_SQUARE_*` build variables), so existing deployments keep working. Values saved in the console always take priority.

### 3. Test it
Go to **Donate**, enter an amount and your details, click **Continue to Payment**, and use one of [Square's sandbox test card numbers](https://developer.squareup.com/docs/testing/test-values) (e.g. `4111 1111 1111 1111`, any future expiry, any CVV) in the popup.

### 4. Go live
Switch **Environment** to `Production`, enter your **Production** Application ID / Access Token / Location ID, and save. The Donate page automatically loads Square's production script — there is nothing to edit in `index.html` any more.

### Notes & limitations
- **Bank account (ACH) payments** are shown as a second tab in the popup automatically if your Square account supports them — this varies by region/account, so it may not appear for all merchants.
- **Recurring donations** (monthly/annually): the popup currently charges the first payment immediately via Square. True recurring billing requires Square's Customers + Subscriptions APIs (storing a card on file and creating a subscription plan) — this isn't wired up yet, so monthly/annual donors are currently charged once per visit to the Donate page. This is a good next step if recurring giving becomes a priority.

---

## Environment Variables

### Backend
| Variable       | Example                      | Description           |
|----------------|------------------------------|-----------------------|
| `PORT`         | `5000`                       | API listen port       |
| `DATABASE_URL` | `postgresql://...@...neon.tech/hseducation?sslmode=require` | Neon (or any Postgres) connection string — see "Neon Database Setup" |
| `SQUARE_ACCESS_TOKEN` | `EAAA...`              | *Optional fallback* — normally set in Admin Console → Square Settings |
| `SQUARE_LOCATION_ID`  | `L1ABC...`             | *Optional fallback* — as above |
| `SQUARE_APPLICATION_ID` | `sandbox-sq0idb-...` | *Optional fallback* — as above |
| `SQUARE_ENVIRONMENT`  | `sandbox` / `production` | *Optional fallback* — as above |
| `SETTINGS_ENCRYPTION_KEY` | long random string | Encrypts secrets saved in the console (falls back to `JWT_SECRET`). Changing it means re-entering saved secrets |
| `ADMIN_USERNAME` | `admin`                    | First super admin login — only created when the users table is empty |
| `ADMIN_PASSWORD` | `HSE$1`                    | First super admin password (change before deploying) |
| `JWT_SECRET`     | long random string          | Signs admin session tokens — set a real secret in production |
| `FRONTEND_URL` | `https://hseducation.com.au` | CORS allowed origin   |

### Frontend
| Variable       | Example                           | Description             |
|----------------|-----------------------------------|-------------------------|
| `PORT`         | `3000`                            | Nginx listen port       |
| `BACKEND_URL`  | `http://hse-backend.internal:5000`| Backend internal URL    |

---

## Admin Console

The **"Admin"** link in the footer (just below **Legal**) opens a full admin console page — not a popup. If you're not logged in, it shows an inline login card right on that page; once logged in, it shows a tabbed dashboard. This mirrors the structure used by Kutumb's admin console: a real backend-verified session (bcrypt-hashed password + JWT in an httpOnly cookie — see `backend/js/lib/auth.js`), not just a frontend check.

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `HSE$1` |

This first account is created automatically the first time the server starts **on a brand-new install** (see `backend/js/bootstrapAdmin.js`) and is a Super Admin — **change the password** by setting `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/js/.env` before deploying, or log in and use **Change Password** (top right of the console). It's only created when there are no users at all, so if you later add your own users and remove this one, it stays removed.

**Tabs:**
- **Donations** — every donation with its status, pulled live from `/api/donations` (admin-only — this endpoint 401s without a valid session, since it contains donor names/emails/phone numbers).
- **Projects** — view and add projects/programs; backed by `/api/programs` (reading programs is public, but creating/editing/deleting requires an Editor, Admin or Super Admin login). Viewers see the list without the add/remove controls.
- **Users** *(Super Admin only)* — a table of everyone who can log in. Add users, edit their name/email/role, reset a password, disable/enable an account, or remove it. A "What each role can do" panel sits under the table.
- **Square Settings** *(Super Admin only)* — Square environment, Application ID, Location ID and access token, with a **Test Connection** button. See "Square Payments Setup" above.
- **Database Tables** *(Super Admin only)* — a generic browser/editor over the tables in your Neon database (`donations`, `programs`, `providers`, `admin_audit_log`). Pick a table from the dropdown, then:
  - **Search** — one box searches across every column at once.
  - **Filter** — click the ▼ next to any column header for a checklist of that column's distinct values; check the ones you want to see.
  - **Sort** — click a column header to sort by it, click again to reverse.
  - **Add / Edit / Delete** — add a new row, edit any cell inline, or delete a row entirely.

  `users`, `admin_users` and `app_settings` are deliberately left out of this generic editor (passwords must go through proper hashing, and settings hold encrypted secrets) — use the Users and Square Settings tabs for those. Everything here requires an active database connection (see "Neon Database Setup" above) — it has nothing to show when running on the in-memory fallback.

### Roles

| Role | Donations | Projects | Users | Square Settings | Database Tables |
|---|---|---|---|---|---|
| **Super Admin** | view + update status | add / edit / remove | ✅ | ✅ | ✅ |
| **Admin** | view + update status | add / edit / remove | — | — | — |
| **Editor** | view | add / edit / remove | — | — | — |
| **Viewer** | view | view | — | — | — |

Safeguards: you can't delete, disable or demote your own account, and the system won't let the last active Super Admin be removed, disabled or demoted. Role changes and disabling an account take effect **immediately** — even for someone already logged in — because every request re-checks the user in the database. Passwords are bcrypt-hashed, must be at least 8 characters, and user/Square changes are recorded in `admin_audit_log`.

### Upgrading an existing database
Run `npm run migrate` (`app.cmd` does this for you). It creates the new `users` and `app_settings` tables and **copies your existing `admin_users` accounts into `users`** (same ids, same passwords), so current logins keep working. The old `admin_users` table is left in place untouched.

**How the access control actually works:** hiding a tab in the React UI is just a convenience — the real boundary is server-side. `requireStaff` / `requireEditor` / `requireAdmin` / `requireSuperAdmin` (checked per route) independently verify the session cookie/JWT on the backend regardless of what the frontend shows, the same pattern Kutumb uses with its `requireAdmin`/`requireSuperAdmin` middleware.

A session lasts **12 hours**, matching the JWT's expiry, then you'll need to log in again.

---

## Charity Details

| Field              | Value                                                |
|--------------------|-------------------------------------------------------|
| Public name        | Headstart Education                                  |
| Legal entity       | Headstart Education Australia Pty Ltd                |
| ACNC Status        | Registered Australian charity                        |
| Website            | hseducation.com.au                                   |
| Email              | info@hseducation.org                              |
| Address            | Sydney NSW 2000                                      |
| Current stage      | Preparing for first project (Uttar Pradesh, India)   |
| Founding directors | Harsh Singh (Chairman), Pramod Singh, Tavishi Makhija |

ABN and DGR (tax-deductibility) status are intentionally not published on the site yet, since they aren't confirmed — add them to `LegalPage.jsx` and `Footer.jsx` once available.


---

## Northflank: database & email notes

- **DATABASE_URL** must be set as a *runtime environment variable on the same service that runs the backend* (the one built from `Dockerfile`). Paste only the URL (`postgresql://…`), no `psql` prefix or quotes.
- Tables are created automatically on the first successful connection (`lib/ensureSchema.js`) — no manual `npm run migrate` is needed. If Neon is asleep the server retries on start and then every 30s.
- Open `https://<your-app>/healthz`: `"database": "postgresql"` means connected; otherwise `databaseError` shows why.
- **Admin Console → Email Settings** (super admin) holds the SMTP details used for donor receipts and "new donation" alerts, with a Test button.

## Website images (Admin Console → Images)

All photos are stored in the `site_images` table (BYTEA) and served from `/api/images/<key>`. The original photos ship in `backend/seed-images` and are loaded into an empty database automatically; existing rows (including images you've replaced) are never overwritten. Each image lists where it's used and its purpose (`backend/js/lib/imageCatalog.js` — update it if you add or move an `<img>` on a page). Editors, admins and super admins can replace images, edit the name/purpose, or restore the original; viewers can look but not change.

## AI-written emails (Groq) & system email

- **Admin Console → Groq AI** (super admin): paste your Groq API key (`gsk_…`), pick a model, press Test. The key is stored encrypted.
- **Admin Console → Email Settings** (super admin): the SMTP server all emails are sent through.
- **Admin Console → Contacts** (admin+): members and partners. Donors come from the donations table automatically.
- **Admin Console → Send Email** (admin+): describe the email, Groq drafts it, you edit, send a test, then send to donors / members / partners (max 500 per send). Every email gets an unsubscribe link (`/api/mail/unsubscribe`); unsubscribed people are skipped. Nothing is ever sent without a person pressing Send.
- Run `npm install` in `backend/js` (adds `groq-sdk`) or just redeploy — the Docker build installs it.

> **Admin Console tabs:** Square, System Email and Groq AI credentials now live together under **API Key Settings** (three tiles, each showing whether it's set up). Super Admin only; other roles see a note explaining why.
