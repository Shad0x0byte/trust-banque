# Trust Banque — Production Deployment Guide

> Step-by-step instructions for deploying Trust Banque to Vercel (frontend) and shared hosting (backend), including domain configuration.

---

## Prerequisites

Before you start, you need:
- A **Vercel** account (free tier is fine) — [vercel.com](https://vercel.com)
- A **shared hosting** account with PHP 8.0+ and MySQL 5.7+ (Hostinger, Bluehost, SiteGround, etc.)
- A **domain name** (e.g., `trustbanque.com`) — from Namecheap, GoDaddy, Cloudflare, etc.
- **Git** installed locally
- The project pushed to a GitHub/GitLab repository

---

## Part 1 — Backend on Shared Hosting

### Step 1: Create the Database

1. Log in to your hosting control panel (cPanel or similar).
2. Go to **MySQL Databases** (or phpMyAdmin).
3. Create a new database, e.g., `youraccount_banking`.
4. Create a database user with a strong password.
5. Grant the user **ALL PRIVILEGES** on the new database.
6. Note your credentials:
   - Host: `localhost` (almost always)
   - Database name: `youraccount_banking`
   - Username: `youraccount_dbuser`
   - Password: `your_password`

### Step 2: Import the Schema

1. Open **phpMyAdmin** from your control panel.
2. Select the database you just created.
3. Click the **Import** tab.
4. Upload `banking-api/sql/schema.sql`.
5. Click **Go** to run it.
6. If the `profile_picture` column is missing, also run `migrations.sql`.

> **Common error:** `IF NOT EXISTS` in `ALTER TABLE` isn't supported on older MySQL versions. Use `ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL;` directly.

### Step 3: Upload the Backend Files

1. Connect to your hosting via FTP/SFTP (use FileZilla, Transmit, or your panel's File Manager).
2. Upload the entire `banking-api/` folder to the server.
   - **Recommended location:** Outside the web root for security.
   - Example: If your web root is `public_html/`, upload `banking-api/` next to it, so the path is `~/banking-api/`.
3. Then configure your hosting to point a **subdomain** (e.g., `api.trustbanque.com`) to `~/banking-api/public/`.

> **Alternatively:** If you can't configure subdomains freely, you can upload `banking-api/` inside `public_html/` as a subfolder: `public_html/banking-api/`. Then your API URL becomes `https://trustbanque.com/banking-api/public/api`.

### Step 4: Configure the `.env` File

On the server, edit `banking-api/.env`:

```env
# Database — use your hosting credentials
DB_HOST=localhost
DB_NAME=youraccount_banking
DB_USER=youraccount_dbuser
DB_PASS=your_strong_password

# CORS — must be your Vercel app URL (no trailing slash)
CORS_ORIGIN=https://trust-banque.vercel.app

# JWT secret — generate a strong one:
# php -r "echo bin2hex(random_bytes(32));"
JWT_SECRET=your_64_char_hex_secret_here

# Environment
APP_ENV=production

# Public URL of this backend (used for profile picture URLs)
# Must be the URL pointing to banking-api/public/
APP_URL=https://api.trustbanque.com
```

> **Generate JWT secret:** Run this via SSH or a PHP file temporarily:
> ```php
> <?php echo bin2hex(random_bytes(32)); ?>
> ```

### Step 5: Create the Uploads Directory

Via SSH or File Manager, create this directory and set permissions:

```bash
mkdir -p ~/banking-api/public/uploads/profile_pictures
chmod 755 ~/banking-api/public/uploads
chmod 755 ~/banking-api/public/uploads/profile_pictures
```

The `.htaccess` file in `public/uploads/` blocks PHP execution — make sure it's uploaded.

### Step 6: Point a Subdomain to the API

In your hosting control panel:
1. Go to **Subdomains** (or **Addon Domains**).
2. Create subdomain: `api.trustbanque.com`
3. Set **Document Root** to: `banking-api/public` (relative to your home directory, so `~/banking-api/public`).
4. Save. SSL will be provisioned automatically if you have Let's Encrypt enabled (most hosts do).

### Step 7: Test the Backend

Visit `https://api.trustbanque.com/index.php` in your browser. You should see a JSON response:

```json
{ "status": "Trust Banque API running" }
```

If you see a 500 error, check:
- PHP error logs (cPanel → Error Logs)
- `.env` file is correctly formatted
- Database credentials are correct
- File permissions on `uploads/` are 755

---

## Part 2 — Frontend on Vercel

### Step 1: Push to GitHub

Make sure your project is in a GitHub repo. If not:

```bash
cd trust-banque
git init
git add .
git commit -m "Initial commit"
gh repo create trust-banque --public --push
# Or: git remote add origin https://github.com/yourname/trust-banque.git && git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import Git Repository** and select your repo.
3. Vercel will auto-detect SvelteKit.
4. Set the **Root Directory** to `frontend` (since your frontend is in a subdirectory).
5. **Do not click Deploy yet** — first configure environment variables.

### Step 3: Set Environment Variables

In the Vercel project settings (or during import), add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.trustbanque.com/api` |

> This is the full base URL for API calls. It must end in `/api` (or whatever matches your hosting path). The frontend appends specific endpoints like `/auth/login.php` to this base.

### Step 4: Deploy

Click **Deploy**. Vercel will:
1. Clone your repo
2. Run `npm install` in the `frontend/` directory
3. Run `npm run build` (SvelteKit with adapter-static)
4. Deploy the `build/` output to Vercel's CDN

You'll get a URL like `https://trust-banque-xxx.vercel.app`.

### Step 5: Test the Deployment

1. Visit your Vercel URL.
2. Try logging in with a test account.
3. Open browser DevTools → Network tab — check that API calls go to your backend domain and return 200.

**Common issues:**
- **CORS error** in console → Your `CORS_ORIGIN` in `.env` doesn't match the Vercel URL exactly.
- **404 on API calls** → `VITE_API_URL` is wrong or backend isn't reachable.
- **Login succeeds but redirects break** → The `adapter-static` 404 fallback needs configuring (see below).

### Step 6: Fix SPA Routing (404 on Refresh)

Since Trust Banque is a SPA, refreshing `/dashboard` or any deep link will 404 without a redirect rule.

In your `frontend/` directory, create `static/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Or create `vercel.json` at the project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/frontend/build/index.html" }]
}
```

Commit and push — Vercel will redeploy automatically.

---

## Part 3 — Custom Domain on Vercel

### Step 1: Add Your Domain to Vercel

1. In your Vercel project, go to **Settings → Domains**.
2. Click **Add Domain**.
3. Type your domain: `trustbanque.com`.
4. Vercel will show you DNS records to configure.

### Step 2: Configure DNS

Go to wherever your domain's DNS is managed (your registrar, or Cloudflare if using it):

**Option A — Use Vercel's nameservers (recommended for Vercel):**

1. In your registrar, change nameservers to Vercel's:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
2. Vercel then manages all DNS for the domain.
3. Add an A record for `api.trustbanque.com` pointing to your hosting server's IP (get this from your hosting panel).

**Option B — Keep your registrar's DNS:**

Add these DNS records:

| Type | Name | Value |
|---|---|---|
| `A` | `@` (or `trustbanque.com`) | `76.76.21.21` (Vercel IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `api` | Your hosting's server hostname (e.g., `server123.hostinger.com`) |

> **Get Vercel's current IP:** Vercel occasionally changes IPs. Always get the current value from Vercel's domain settings page after adding your domain.

### Step 3: Wait for Propagation

DNS propagation can take 5 minutes to 48 hours. You can check with:

```bash
dig trustbanque.com
nslookup trustbanque.com 8.8.8.8
```

### Step 4: SSL Certificates

- **Vercel** automatically provisions and renews SSL for `trustbanque.com` via Let's Encrypt. No action needed.
- **Shared hosting** (`api.trustbanque.com`) — Enable Let's Encrypt SSL in your hosting panel's SSL/TLS section. Most hosts (Hostinger, Bluehost) do this with one click.

### Step 5: Update CORS

Once your custom domain is live, update `banking-api/.env`:

```env
CORS_ORIGIN=https://trustbanque.com
```

And update Vercel's environment variable if your API subdomain changed:
```
VITE_API_URL=https://api.trustbanque.com/api
```

Redeploy (push an empty commit or click **Redeploy** in Vercel).

---

## Part 4 — Go-Live Checklist

Run through this before telling users your site is live:

**Backend:**
- [ ] Database imported successfully (all tables exist)
- [ ] `.env` has production values (real DB, real JWT secret, production APP_URL)
- [ ] `CORS_ORIGIN` matches your exact Vercel/custom domain URL
- [ ] `uploads/profile_pictures/` directory exists and is writable
- [ ] `.htaccess` in `uploads/` is uploaded (blocks PHP execution)
- [ ] Test API health: `curl https://api.trustbanque.com/` returns JSON
- [ ] Test login: create a test user via register, then log in
- [ ] `APP_ENV=production` (disables error details in responses)

**Frontend:**
- [ ] `VITE_API_URL` set correctly in Vercel environment variables
- [ ] `vercel.json` rewrite rule in place (SPA routing)
- [ ] Custom domain added and SSL active
- [ ] Test login → dashboard flow in browser
- [ ] Test transfer → PIN modal → success
- [ ] Test profile picture upload (admin panel)
- [ ] Check mobile layout on an actual phone

**Security:**
- [ ] JWT_SECRET is 32+ random bytes (never a dictionary word)
- [ ] Database password is strong and unique
- [ ] `.env` file is not publicly accessible (should be above `public/`)
- [ ] `APP_ENV=production` is set

---

## Part 5 — Ongoing Maintenance

### Redeploying the Frontend

Push any commit to your `main` branch → Vercel redeploys automatically.

### Updating the Backend

FTP/SFTP the changed `.php` files to the server. No restart needed — PHP is stateless.

### Database Backups

Set up automated backups in your hosting panel (most panels have this under **Backups**). Or use a cron job:

```bash
mysqldump -u dbuser -pdbpassword dbname > backup_$(date +%Y%m%d).sql
```

### Adding New Users

Users self-register at `/signup`. For admin users, manually set `role = 'admin'` in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@trustbanque.com';
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| CORS error on all requests | `CORS_ORIGIN` mismatch | Update `.env` CORS_ORIGIN to exact frontend URL |
| 401 on all API calls | JWT_SECRET mismatch or token expired | Check JWT_SECRET in `.env`; re-login |
| Images not loading | `APP_URL` wrong or uploads directory wrong | Check `APP_URL` in `.env`; ensure uploads are in `public/uploads/` |
| 500 on login | DB connection failed | Check DB credentials in `.env` |
| Page refresh gives 404 | Missing SPA rewrite rule | Add `vercel.json` with `rewrites` |
| Profile picture shows broken | Files saved to wrong path | Ensure `$uploadDir` in PHP points to `public/uploads/profile_pictures/` |
