# Trust Banque — Architecture Overview

> A technical deep-dive into how Trust Banque is built, the decisions behind each choice, and how the pieces fit together.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Frontend — SvelteKit](#2-frontend--sveltekit)
3. [Backend — PHP REST API](#3-backend--php-rest-api)
4. [Database — MySQL](#4-database--mysql)
5. [Authentication — JWT](#5-authentication--jwt)
6. [File Storage — Profile Pictures](#6-file-storage--profile-pictures)
7. [State Management](#7-state-management)
8. [Security Model](#8-security-model)
9. [Key Design Decisions](#9-key-design-decisions)
10. [Directory Structure](#10-directory-structure)

---

## 1. High-Level Architecture

```
User's Browser
      │
      ▼
┌─────────────────────────────────────────┐
│        SvelteKit Frontend               │
│        (Deployed on Vercel)             │
│                                         │
│  Static SPA — no SSR (adapter-static)  │
│  Routes: /login, /signup, /dashboard   │
└───────────────────┬─────────────────────┘
                    │ HTTPS REST API calls
                    │ (Authorization: Bearer <JWT>)
                    ▼
┌─────────────────────────────────────────┐
│         PHP REST API Backend            │
│    (Deployed on shared hosting)         │
│                                         │
│  /public/api/**/*.php endpoints         │
│  Stateless — JWT-authenticated          │
│  CORS locked to Vercel origin           │
└───────────────────┬─────────────────────┘
                    │ PDO / MySQL
                    ▼
┌─────────────────────────────────────────┐
│           MySQL Database                │
│      (Shared hosting server)            │
│                                         │
│  Tables: users, accounts, transactions  │
│          sessions, cards, audit_logs    │
└─────────────────────────────────────────┘
```

The frontend and backend are **completely decoupled**. The frontend is a pure static SPA served from Vercel's CDN. The backend is a traditional PHP application on shared hosting. They communicate exclusively over HTTPS with JSON payloads.

---

## 2. Frontend — SvelteKit

### Why SvelteKit?

SvelteKit was chosen over React/Next.js or Vue for several reasons:

- **No virtual DOM overhead** — Svelte compiles to vanilla JS, producing a smaller and faster bundle than React equivalents.
- **Built-in routing** — File-system routing eliminates the need for React Router or similar.
- **Excellent TypeScript support** — First-class `.ts` in `<script lang="ts">` blocks.
- **adapter-static** — Since the backend is PHP (not Node.js), the frontend is exported as a pure static SPA. `adapter-static` compiles SvelteKit to HTML/CSS/JS with no server-side rendering, making it trivially deployable to Vercel, Netlify, or even a CDN bucket.

### Why adapter-static (No SSR)?

The backend is PHP on shared hosting — there's no Node.js process to run SSR. Using `adapter-static` means:
- Every page is client-rendered (SPA model).
- Vercel serves a static bundle; all data fetching happens client-side via `onMount()`.
- The tradeoff is no SEO for authenticated dashboard pages — acceptable for a banking app where all meaningful pages require login anyway.

### Routing Structure

```
src/routes/
├── +page.svelte          # Landing page (public)
├── login/+page.svelte    # Login (public)
├── signup/               # Multi-step signup wizard
│   ├── +page.svelte      # Step 1: account type
│   ├── personal/         # Step 2: personal info
│   ├── address/          # Step 3: address + photo
│   ├── verify/           # Step 4: verification
│   └── complete/         # Step 5: done
├── dashboard/            # Protected customer area
│   ├── +layout.svelte    # Sidebar nav + auth guard
│   ├── +page.svelte      # Overview
│   ├── accounts/         # Account management
│   ├── cards/            # Debit cards
│   ├── transfer/         # Send money
│   ├── transactions/     # Transaction history
│   ├── statements/       # Monthly statements
│   └── security/         # Sessions + security
└── admin/                # Protected admin area
    ├── +layout.svelte    # Admin sidebar + role guard
    ├── +page.svelte      # Admin overview
    ├── users/            # Customer management
    ├── transactions/     # All transactions
    ├── cards/            # All cards
    ├── logs/             # Audit logs
    └── settings/         # System settings
```

### API Client (`src/lib/api/client.ts`)

All API calls are centralized here. It:
- Reads `VITE_API_URL` from the environment to know where the backend lives.
- Automatically attaches the JWT from `localStorage` to every request (`Authorization: Bearer`).
- Returns a typed `{ success, data, error }` envelope.
- Has named functions for common operations (`login`, `register`, `initiateInternalTransfer`, etc.).

This means changing the backend URL requires updating a single `.env` variable — nothing else changes.

### Styling — Tailwind CSS v4

Tailwind v4 is used with `@theme` tokens for brand colors and fonts. The design system uses:
- **Sora** (Google Fonts) — headings; modern geometric sans-serif.
- **Inter** — body text; exceptional readability at small sizes.
- **JetBrains Mono** — account numbers and financial data.

---

## 3. Backend — PHP REST API

### Why PHP on Shared Hosting?

The project targets deployment on shared hosting (e.g., cPanel / Hostinger / Bluehost) — environments where PHP is universally available but Node.js is not. This constraint drove the entire backend choice:

- **Zero infrastructure to manage** — No containers, no VMs, no deployment pipelines.
- **PHP is ubiquitous** — Works on any hosting plan from $3/month.
- **Stateless REST** — Each `.php` file is a self-contained endpoint. No framework overhead.

### Why No Framework (Laravel/Symfony)?

A micro-framework approach was deliberately chosen:
- **Lower dependency surface** — No Composer autoloading complexities on shared hosting.
- **Predictable deployment** — Just upload files via FTP/SFTP; no build step.
- **Easier to understand** — Any PHP developer can read `auth/login.php` and immediately understand what it does.

### Endpoint Structure

Every endpoint follows the same pattern:

```php
require_once '../../../lib/headers.php';   // CORS + JSON headers
require_once '../../../config/config.php'; // DB + env
require_once '../../../lib/Auth.php';      // JWT validation

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$payload = Auth::requireAuth(); // validates JWT, returns decoded payload
$userId  = (int) $payload['sub'];

// ... business logic ...

Response::success($data, 'Optional message');
```

### Response Envelope

All responses follow this envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Or on error:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

This consistent shape lets the frontend use a single `apiRequest<T>()` helper for all calls.

---

## 4. Database — MySQL

### Schema Overview

```
users
├── id, email, password_hash, role
├── first_name, last_name, phone, date_of_birth
├── address fields (street, city, state, zip, country)
├── profile_picture (relative path: uploads/profile_pictures/...)
└── created_at, updated_at

accounts
├── id, user_id (FK → users)
├── account_type (checking | savings)
├── account_number (16-digit, unique)
├── balance, available_balance
├── status (active | frozen | closed)
└── nickname, created_at

transactions
├── id, account_id (FK → accounts), user_id
├── type (deposit | withdrawal | transfer | payment | fee | interest)
├── amount (positive = credit, negative = debit)
├── description, merchant, category, note
├── status (completed | pending | failed)
├── reference_number, sender_name, sender_details
└── created_at

sessions
├── id, user_id (FK → users)
├── token_hash (SHA-256 of JWT)
├── ip_address, user_agent
├── created_at, last_active_at, expires_at
└── is_active

cards
├── id, account_id, user_id
├── card_number (masked), card_type, network
├── expiry_month, expiry_year, status
└── spending_limit, created_at

audit_logs
├── id, user_id, admin_id
├── action, target_user_id
├── details, ip_address
└── created_at
```

### Design Decisions

**Positive/negative amounts for transactions** — Rather than `debit_amount`/`credit_amount` columns, a single `amount` field uses sign to indicate direction. Positive = money in, negative = money out. This simplifies queries like "sum all transactions" and is standard in accounting systems.

**`sessions` table for active session tracking** — JWTs are stateless by design, but banking requires the ability to show users their active sessions and (potentially) revoke them. The sessions table stores a hash of the JWT alongside device info. This gives the best of both worlds: stateless verification for most requests, revocable sessions for security visibility.

---

## 5. Authentication — JWT

### Flow

```
1. POST /api/auth/login.php  { email, password }
         │
         ▼
2. PHP verifies bcrypt hash
         │
         ▼  
3. PHP signs JWT (HS256) with JWT_SECRET
   Payload: { sub: userId, email, role, exp: +24h }
         │
         ▼
4. Frontend stores token in localStorage
   (auth store hydrates from localStorage on every page load)
         │
         ▼
5. Every subsequent API request:
   Authorization: Bearer <token>
         │
         ▼
6. PHP Auth::requireAuth() decodes + verifies signature
   Returns payload if valid, 401 if not
```

### Why localStorage (not httpOnly cookies)?

The frontend is on Vercel (domain A) and the backend is on shared hosting (domain B). Cross-domain `httpOnly` cookies would require `SameSite=None; Secure` and careful CORS cookie handling — complex to get right on shared hosting. `localStorage` + `Authorization` header is simpler and works reliably in this cross-origin setup.

The tradeoff: XSS vulnerability. This is mitigated by Svelte's auto-escaping of template expressions.

---

## 6. File Storage — Profile Pictures

Profile pictures are stored on the server filesystem (not a cloud bucket like S3) because shared hosting doesn't support S3 natively.

**Upload path:** `banking-api/public/uploads/profile_pictures/`  
**Naming:** `user_{id}_{8_random_bytes}.{ext}` — ties the file to the user, prevents enumeration.  
**Public URL:** `{APP_URL}/uploads/profile_pictures/{filename}`

The `.htaccess` in the uploads directory blocks PHP execution — preventing an attacker from uploading a PHP file disguised as an image and executing it.

**MIME validation** uses PHP's `finfo` extension (reads the actual file magic bytes) rather than trusting the `Content-Type` header or file extension, which attackers control.

---

## 7. State Management

The frontend uses Svelte's built-in `writable` stores:

- **`auth` store** — Holds `{ isAuthenticated, user, token, loading }`. Persisted to `localStorage`. All pages subscribe to this to check auth status and get the current user.
- **`toast` store** — Queue of notification toasts (success/error/info). The Toast component subscribes and renders them.
- **`signup` store** — Accumulates multi-step signup form data across route navigations (personal → address → verify).

No external state library (Zustand/Pinia/Redux) is needed. Svelte stores are reactive by default.

---

## 8. Security Model

| Concern | Mitigation |
|---|---|
| SQL injection | PDO prepared statements throughout |
| XSS | Svelte auto-escapes template expressions |
| CSRF | JWT in Authorization header (not cookies) — CSRF doesn't apply |
| Password storage | `password_hash()` with `PASSWORD_BCRYPT` |
| File upload attacks | MIME validation via `finfo`, PHP execution blocked in uploads/ |
| JWT forgery | HS256 signed with 64-char secret from `.env` |
| Unauthorized access | `Auth::requireAuth()` called at the top of every protected endpoint |
| Admin privilege escalation | Every admin endpoint checks `$payload['role'] === 'admin'` |
| Transaction PIN | Hardcoded `0419` verified client-side before API call; server validates independently |

---

## 9. Key Design Decisions

**Decision: Static SPA vs SSR**  
SSR would improve initial page load and SEO. We chose SPA because the PHP backend can't run Node.js SSR, and dashboard pages don't need SEO. The tradeoff is acceptable.

**Decision: No backend framework**  
Laravel would add elegance but requires Composer, artisan, and a specific directory structure that conflicts with simple shared hosting FTP deployment. Raw PHP files win on simplicity and portability.

**Decision: Tailwind CSS v4 (not v3)**  
Tailwind v4 uses `@theme` for design tokens and pure CSS — no `tailwind.config.js`. This reduces configuration complexity and produces smaller output.

**Decision: Sora + Inter for fonts**  
Playfair Display (serif) was replaced with Sora (geometric sans-serif) for headings and Inter for body text. This produces a more modern, fintech-appropriate aesthetic while maintaining excellent readability on mobile.

---

## 10. Directory Structure

```
trust-banque/
├── frontend/                     # SvelteKit app
│   ├── src/
│   │   ├── app.html              # Root HTML shell (Google Fonts link)
│   │   ├── app.css               # Global styles + Tailwind @theme tokens
│   │   ├── lib/
│   │   │   ├── api/client.ts     # Centralized API client
│   │   │   ├── components/       # Shared UI components
│   │   │   ├── stores/           # Svelte writable stores (auth, toast, signup)
│   │   │   ├── types/index.ts    # TypeScript interfaces
│   │   │   └── utils/            # formatters, validators
│   │   └── routes/               # File-system routing
│   ├── static/                   # Favicon, public assets
│   ├── svelte.config.js          # adapter-static config
│   └── vite.config.ts
│
└── banking-api/                  # PHP backend
    ├── public/                   # Web root (point domain here)
    │   ├── index.php             # Optional API index/health check
    │   ├── uploads/              # User-uploaded files (web-accessible)
    │   │   └── profile_pictures/
    │   └── api/                  # All API endpoints
    │       ├── auth/             # login, register, logout
    │       ├── user/             # profile, upload_picture
    │       ├── transactions/     # list, transfer, external
    │       ├── admin/            # user management, balance adjust
    │       └── cards/            # card management
    ├── config/
    │   └── config.php            # DB connection, env loading
    ├── lib/
    │   ├── Auth.php              # JWT sign/verify, requireAuth()
    │   ├── Database.php          # PDO singleton
    │   ├── Response.php          # JSON response helpers
    │   ├── Logger.php            # Audit log writer
    │   └── headers.php           # CORS + Content-Type headers
    ├── sql/
    │   ├── schema.sql            # Full DB schema (initial)
    │   └── migrations.sql        # Incremental schema changes
    └── .env                      # Secrets (never commit)
```
