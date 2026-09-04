# Nova Pixel — Deployment Runbook

Beginner-friendly, top-to-bottom. Follow the phases **in order**.
Replace `novapixelsoftware.com` with your real domain everywhere.

---

## The mental model

| Piece | What it is | Cost |
|---|---|---|
| **GitHub** | Where your code lives | ₹0 (private repos free) |
| **Cloudflare** | DNS (the phone book for your domain) + SSL + CDN + DDoS shield | ₹0 |
| **Cloudflare Pages** | Builds and serves your React/Angular frontends worldwide | ₹0 |
| **Hostinger VPS** | A Linux computer in a datacenter. Your backends + database run here | ~₹700–2,000/mo |
| **Coolify** | The control room installed on that VPS. Takes code from GitHub → builds a container → runs it → gives it a domain + SSL | ₹0 (open source) |

Request flow:

```
User browser
   │
   ▼
Cloudflare (DNS → SSL → cache → DDoS filter)
   │
   ├── crm.novapixelsoftware.com      → Cloudflare Pages   (Angular build files)
   │        │
   │        └── calls API ─────┐
   │                           ▼
   └── crm-api.novapixelsoftware.com  → Hostinger VPS
                                          └── Coolify
                                               ├── crm-api container
                                               ├── hrms-api container
                                               └── Postgres (per-product DB)
```

### Two words you must understand

**Container (Docker):** a sealed box holding your app *plus* everything it needs —
the right Node version, the libraries, the OS packages. The same box runs
identically on your laptop and on the server. This kills "it works on my
machine but not on the server".

**Coolify:** a web dashboard on your VPS that does the container work for you.
You never type `docker` commands. You click "Deploy".

---

## PHASE 1 — Cloudflare + DNS  *(~30 min work, then wait)*

Do this **first**. DNS changes take time to spread, so start the clock early.

1. Create a free account at https://dash.cloudflare.com
2. **Add a site** → type your domain → choose the **Free** plan
3. Cloudflare imports your existing DNS records and shows you **two nameservers**, e.g.
   ```
   ana.ns.cloudflare.com
   rick.ns.cloudflare.com
   ```
4. Log in to the registrar where you **bought** the domain → find
   *DNS / Nameservers / Custom nameservers* → replace what's there with those two
5. Back in Cloudflare, wait until the domain says **Active** (5 min – 24 hrs)
6. Once active, set these:
   - **SSL/TLS → Overview → Full (strict)**  ⚠️ never "Flexible" (causes redirect loops and leaves traffic unencrypted to your server)
   - **SSL/TLS → Edge Certificates → Always Use HTTPS: On**
   - **Speed → Brotli: On**

> Your registrar stays your registrar. Only DNS management moves to Cloudflare.
> You are not transferring the domain.

---

## PHASE 2 — Put the company website live  *(~15 min)*

Easiest win. Do it before touching the VPS so you get one thing working end to end.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. Project name: `nova-pixel-site`
3. Drag in this whole `project` folder → **Deploy**
4. You get `nova-pixel-site.pages.dev` — open it, confirm it works
5. **Custom domains** tab → **Set up a domain** → `novapixelsoftware.com`
6. Repeat for `www.novapixelsoftware.com`
7. Wait a few minutes → open `https://novapixelsoftware.com`

✅ Company site is live with free SSL. Nothing to maintain.

---

## PHASE 3 — Buy and create the VPS  *(~20 min)*

At https://hpanel.hostinger.com → VPS:

| Setting | Choose |
|---|---|
| Plan | **KVM 2** (2 vCPU / 8 GB) — Coolify alone eats ~2 GB |
| Location | **India** if listed, otherwise **Malaysia / Singapore** (~52 ms) |
| Install | **Control panel → Coolify** |
| Root password | Generate a long random one, save it in a password manager |
| SSH key | Add your public key if you have one (see below) |

**Check the renewal price** on the checkout page before paying — the promo price
is not the renewal price. 12 or 24 months is a sensible first commitment.

**Location cannot be changed later** without rebuilding the server. Pick carefully.

### Make an SSH key (on your Windows machine)

```powershell
ssh-keygen -t ed25519 -C "deploy@novapixel"
# press Enter for the default path, set a passphrase
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub    # paste this into Hostinger
```

The `.pub` file is public and safe to paste. The file **without** `.pub` is your
private key — never share it, never commit it.

---

## PHASE 4 — First 30 minutes on the server  *(security — do not skip)*

### 4.1 Claim the Coolify admin account IMMEDIATELY 🔴

The moment the VPS is ready, open:

```
http://<YOUR_VPS_IP>:8000
```

Create the admin account **right now**. Coolify hands admin to whoever registers
first, and bots scan public IPs for open ports. Do not leave this for tomorrow.

### 4.2 Harden SSH and the firewall

```bash
ssh root@<YOUR_VPS_IP>

# 1. a normal user instead of root
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# 2. copy your SSH key over to that user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
```

**Test the new user in a second terminal before locking root out:**

```bash
ssh deploy@<YOUR_VPS_IP>     # must succeed
```

Only once that works:

```bash
sudo nano /etc/ssh/sshd_config
#   PermitRootLogin no
#   PasswordAuthentication no
sudo systemctl restart ssh

# firewall
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable
sudo ufw status

# brute-force protection + auto security patches
sudo apt update && sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4.3 Give the Coolify dashboard a domain, then close port 8000

1. Cloudflare DNS → `A` record: `deploy` → your VPS IP → proxy **ON** (orange)
2. In Coolify → **Settings → Instance domain** → `https://deploy.novapixelsoftware.com`
3. Confirm the dashboard loads over HTTPS on that domain
4. Then remove port 8000 from the internet:
   ```bash
   sudo ufw deny 8000
   ```

Never leave a control dashboard reachable at `IP:port` with no TLS.

---

## PHASE 5 — DNS records for your products

Cloudflare → your domain → **DNS → Records**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `crm-api` | VPS IP | 🟠 Proxied |
| A | `hrms-api` | VPS IP | 🟠 Proxied |
| A | `deploy` | VPS IP | 🟠 Proxied |
| CNAME | `crm` | (added automatically by Pages) | 🟠 Proxied |

**Naming rule:** always one level deep.
`crm-api.novapixelsoftware.com` ✅ — `api.crm.novapixelsoftware.com` ❌
(Cloudflare's free SSL does not cover two-level wildcards.)

---

## PHASE 6 — Deploy your first backend

### 6.1 Practise with a throwaway app first

Before your real product, deploy a hello-world API. You want to learn the
Coolify flow on something you don't care about.

```js
// index.js
const express = require("express");
const app = express();
app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/", (_, res) => res.json({ hello: "nova pixel" }));
app.listen(3000, () => console.log("up on 3000"));
```

Push it to a private GitHub repo.

### 6.2 Connect GitHub to Coolify

Coolify → **Sources → + Add → GitHub App** → install it on your GitHub account →
select which repos Coolify may read.

### 6.3 Deploy

1. **Projects → + Add** → name it `crm`
2. **+ New Resource → Application → Public/Private Repository** → pick the repo
3. Build pack: **Nixpacks** (auto-detects Node/Python/PHP — no Dockerfile needed to start)
4. **Port:** `3000` (the port your app listens on *inside* the container)
5. **Domains:** `https://crm-api.novapixelsoftware.com`
6. **Health check path:** `/health`
7. **Deploy**

Watch the build logs in the dashboard. When it goes green, open
`https://crm-api.novapixelsoftware.com/health` → you should see `{"ok":true}`.

SSL was issued automatically. You did not configure Nginx. That is the point of Coolify.

### 6.4 Add the database

1. Same project → **+ New Resource → Database → PostgreSQL**
2. Coolify generates a password and an **internal** connection URL
3. Copy that URL into your app's **Environment Variables** as `DATABASE_URL`
4. Redeploy the app

⚠️ Keep the database **internal only** (do not expose a public port). Your app
reaches it over Coolify's private Docker network. If you need to inspect it from
your laptop, use an SSH tunnel:

```bash
ssh -L 5433:localhost:5432 deploy@<VPS_IP>
# then connect your DB client to localhost:5433
```

**One database per product.** It feels like extra work now; it saves you when a
client asks for a dedicated instance or you sell one product separately.

### 6.5 Environment variables

Backend secrets (DB password, JWT secret, payment keys) go in **Coolify →
Environment Variables**. Never in the repo. Add a `.gitignore` entry for `.env`
and commit a `.env.example` with empty values instead.

### 6.6 Move to a Dockerfile when you need control

Nixpacks is fine to start. When you need a specific runtime version or build
step, add a `Dockerfile` to the repo and switch the build pack:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## PHASE 7 — Deploy the product frontends (React / Angular)

One Cloudflare Pages project **per product**.

1. **Workers & Pages → Create → Pages → Connect to Git** → pick the repo
2. Build settings:

| Framework | Build command | Output directory |
|---|---|---|
| React (Vite) | `npm run build` | `dist` |
| React (CRA) | `npm run build` | `build` |
| Angular 17+ | `npm run build -- --configuration production` | `dist/<app-name>/browser` |
| Angular ≤16 | `npm run build -- --prod` | `dist/<app-name>` |

3. **Environment variables:** `VITE_API_URL=https://crm-api.novapixelsoftware.com`
   (Angular: put it in `src/environments/environment.prod.ts`)
4. **Custom domains** → `crm.novapixelsoftware.com`

### The SPA 404 trap — fix it before you forget

Create `public/_redirects` in the frontend repo:

```
/*  /index.html  200
```

Without this, `crm.novapixelsoftware.com/customers` works when you click a link
but returns **404 on refresh**, because that path only exists in your JS router,
not on the server.

### ⚠️ Frontend env vars are public

Anything you put in `VITE_*` / `environment.prod.ts` ships to the browser and
anyone can read it in DevTools. API base URLs are fine. **API keys, DB
credentials and secrets are not.** Those live only in Coolify.

---

## PHASE 8 — Wire frontend and backend together

### CORS (backend side)

```js
app.use(cors({
  origin: ["https://crm.novapixelsoftware.com"],   // exact origin, never "*"
  credentials: true
}));
```

`Access-Control-Allow-Origin: *` together with credentials is rejected by every
browser. List the exact origins.

### Login cookies — your subdomain advantage

Because everything sits under one root domain, one cookie works across all
products (free SSO):

```
Set-Cookie: token=...; Domain=.novapixelsoftware.com; HttpOnly; Secure; SameSite=Lax; Path=/
```

- `HttpOnly` — JavaScript can't read it, so XSS can't steal it
- **Never store JWTs in `localStorage`.** Any injected script can read it.

### Large file uploads

Cloudflare's free plan caps request bodies at **100 MB** and requests at ~100 s.
For big uploads, don't push files through your API — issue a presigned URL and
let the browser upload straight to **Cloudflare R2**. Cheaper, faster, and it
keeps your VPS disk empty (files on the VPS disk die with the VPS).

### Transactional email

Do **not** send email from the VPS. Port 25 is usually blocked and a fresh IP
lands in spam. Use **Brevo** (300/day free), Resend, or AWS SES.
Mailboxes like `hello@novapixelsoftware.com` → **Zoho Mail** free plan (5 users);
add its MX records in Cloudflare DNS.

---

## PHASE 9 — Backups and monitoring  *(day one, not later)*

You now hold client data. Treat it that way.

1. **Coolify → your Postgres → Backups** → schedule **daily**
2. Destination: **Cloudflare R2** or any S3 bucket — *off the VPS*.
   A backup stored on the same server is not a backup.
3. **Restore-test it once.** An untested backup is a guess.
4. Hostinger **snapshots** weekly as a second layer (whole-server rollback)
5. Coolify **health checks** + email/Telegram notification on container failure
6. Cloudflare **Web Analytics** — free, cookie-less, no consent banner needed

Optional but worth it: **UptimeRobot** (free) pinging
`https://crm-api.novapixelsoftware.com/health` every 5 minutes.

---

## PHASE 10 — Pro touch: lock the origin

Right now someone who learns your VPS IP can hit it directly and bypass
Cloudflare. Fix it by allowing 80/443 **only** from Cloudflare's IP ranges
(published at https://www.cloudflare.com/ips/):

```bash
sudo ufw delete allow 80
sudo ufw delete allow 443
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do
  sudo ufw allow from $ip to any port 80,443 proto tcp
done
sudo ufw reload
```

Keep port 22 open to you only (or to your IP).

---

## Order of work, with realistic timings

| # | Phase | Time |
|---|---|---|
| 1 | Cloudflare + nameservers | 30 min + propagation wait |
| 2 | Company website live on Pages | 15 min |
| 3 | Buy VPS with Coolify | 20 min |
| 4 | Claim Coolify admin + harden server | 45 min |
| 5 | DNS records | 10 min |
| 6 | Hello-world API deployed | 1–2 hrs (first time) |
| 6 | Real backend + Postgres | half a day |
| 7 | First frontend on Pages | 1 hr |
| 8 | CORS + cookies working | 1–2 hrs |
| 9 | Backups + monitoring | 45 min |

First product live end-to-end: **2–3 focused days.** The second product takes
an afternoon, because phases 1, 3, 4, 9 and 10 are already done forever.

---

## Rules that will save you

1. **Claim the Coolify admin account the minute the VPS boots.**
2. **Test the new SSH user before disabling root login** — otherwise you lock yourself out.
3. **Cloudflare SSL = Full (strict).** Never Flexible.
4. **Secrets only in Coolify env vars.** Never in a frontend, never in git.
5. **`_redirects` in every SPA repo**, or refresh gives 404.
6. **One database per product.**
7. **Backups off the VPS, tested once.**
8. **Don't run manual `docker` commands** against containers Coolify manages — use the dashboard, or your changes vanish on the next deploy.
9. **No client data on the server until Phase 4 is done.**
10. **One-level subdomains only:** `crm-api.domain.com`, not `api.crm.domain.com`.

---

## What to learn, in this order

Only what you actually need — don't go read a 40-hour DevOps course.

1. **Linux basics** — `cd ls cat nano tail systemctl journalctl`, file permissions
2. **SSH** — keys vs passwords, `ssh`, `scp`, port forwarding
3. **Git** — branches, PRs (Coolify deploys on push, so your branch strategy *is* your deploy strategy)
4. **Docker basics** — image vs container, ports, volumes, env vars. Enough to read a Dockerfile.
5. **DNS basics** — A vs CNAME vs MX, TTL, propagation
6. **Then** Postgres backups/restore, and reading Coolify's logs

You don't need Kubernetes. You won't need it for years, if ever.

---

## Known risk you are accepting

All product backends share one VPS. If that server dies, **every** backend goes
down together — the company website stays up, because it's on Pages.

Mitigations, in order of value:
1. Off-site daily backups (Phase 9) — non-negotiable
2. Uptime monitoring so you find out before your client does
3. When a product gets real paying traffic, move it to its own VPS.
   Everything is a container, so that migration is a few hours, not a rewrite.

Don't over-engineer this on day one. Just get the backups right.
