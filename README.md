# Nova Pixel Software Pvt Ltd — Website

Static website (HTML + CSS + vanilla JS). No build step, no server needed.

```
project/
├── index.html          # single-page site (hero, services, process, why us, industries, about, contact)
├── styles.css          # all styling (dark theme, fully responsive)
├── script.js           # nav, scroll reveal, stat counters, contact form
├── 404.html            # not-found page
├── robots.txt          # SEO crawler rules
├── sitemap.xml         # SEO sitemap
├── _headers            # security + cache headers (Cloudflare Pages / Netlify)
└── assets/
    ├── favicon.svg     # browser tab icon
    ├── logo.svg        # standalone logo
    └── og-image.svg    # social share preview
```

## Run locally

Just double-click `index.html`. Or with a local server:

```powershell
# Python
python -m http.server 8000

# Node
npx serve .
```

Then open http://localhost:8000

---

## STEP 1 — Fill in the placeholders (do this first)

Search and replace these across `index.html` (and `robots.txt` / `sitemap.xml`):

| Placeholder | Where | Replace with |
|---|---|---|
| `www.novapixelsoftware.com` | index.html, robots.txt, sitemap.xml | your actual domain |
| `hello@novapixelsoftware.com` | index.html (contact + footer) | real company email |
| `+91 00000 00000` / `+910000000000` | index.html (contact + footer) | real phone |
| `Bengaluru, Karnataka, India` | index.html, JSON-LD | real registered address |
| `U00000KA2026PTC000000` | About section | real CIN from MCA certificate |
| `YOUR_FORM_ID` | contact form `action` | Formspree form ID (see Step 2) |
| `href="#"` in footer social | footer | LinkedIn / GitHub / X URLs |

PowerShell one-liner example:

```powershell
(Get-Content index.html -Raw) -replace 'novapixelsoftware\.com','yourdomain.com' | Set-Content index.html -Encoding utf8
```

## STEP 2 — Make the contact form actually deliver email

A static site has no backend, so the form needs a form-service. Right now, if you
leave `YOUR_FORM_ID` in place, the form falls back to opening the visitor's email
app — it works, but it's not great.

Best free option: **Formspree** (50 submissions/month free)

1. Sign up at https://formspree.io
2. Create a new form → copy the endpoint, e.g. `https://formspree.io/f/abcdwxyz`
3. In `index.html`, replace the form's `action` with it.

Alternatives that work the same way: **Web3Forms** (250/mo free, no account),
**Netlify Forms** (built in if you host on Netlify — just add `netlify` to the `<form>` tag).

---

## STEP 3 — Hosting (domain already purchased)

### Recommended: Cloudflare Pages — free, fastest, best for India

Why: unlimited bandwidth on the free plan, 300+ global CDN edge locations
(several in India, so pages load in ~50-100ms), free auto-renewing SSL,
free DDoS protection, and you get Cloudflare's DNS for the domain too.

**Option A — drag & drop (2 minutes, no Git):**

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. Name the project `nova-pixel`
3. Drag this whole `project` folder in → **Deploy**
4. You get a live URL like `nova-pixel.pages.dev`

**Option B — connect Git (recommended long-term, auto-deploy on every push):**

```powershell
git init
git add .
git commit -m "Nova Pixel website"
gh repo create nova-pixel-website --private --source=. --push
```

Then in Cloudflare Pages → **Connect to Git** → pick the repo →
Build command: *(leave empty)* · Output directory: `/` → **Save and Deploy**.
After that, every `git push` redeploys automatically.

**Attach your domain:**

1. Pages project → **Custom domains** → **Set up a domain** → enter `yourdomain.com`
2. Add `www.yourdomain.com` the same way
3. Cloudflare tells you which nameservers to set. Log in to the registrar where
   you bought the domain (GoDaddy / Namecheap / BigRock / Hostinger) →
   DNS / Nameservers → change to the two Cloudflare nameservers.
4. Wait 5 min – 24 hrs for DNS propagation. SSL is issued automatically.

If you'd rather not move nameservers, just add a **CNAME** record at your
registrar: `www` → `nova-pixel.pages.dev`, and forward the root domain to `www`.

### Comparison of the realistic options

| Host | Cost | Speed in India | Custom domain + SSL | Best for |
|---|---|---|---|---|
| **Cloudflare Pages** | Free (unlimited bandwidth) | Excellent | Free, automatic | **This site — pick this** |
| Netlify | Free (100 GB/mo) | Very good | Free, automatic | Easiest forms handling |
| Vercel | Free (hobby) | Very good | Free, automatic | If you move to Next.js later |
| GitHub Pages | Free | Good | Free, automatic | Simplest, but no `_headers`, no redirects |
| Hostinger / shared cPanel | ₹150–400/mo | Good (India DC) | Free SSL, manual setup | Only if you also need PHP + business email |
| AWS S3 + CloudFront | ~₹50–200/mo | Excellent | Manual, fiddly | Only when you have AWS reasons |
| VPS (DigitalOcean/EC2) | ₹400+/mo | Good | You manage everything | Overkill — don't |

**Short answer:** for a static company site with a domain you already own,
**Cloudflare Pages** is the best choice — ₹0/month, fastest in India, zero server
maintenance, and it scales to any traffic. Shared hosting only makes sense if you
also want `you@yourdomain.com` mailboxes bundled in.

### Business email (separate from hosting)

Hosting doesn't give you `hello@yourdomain.com`. Options:
- **Zoho Mail** — free for 1 domain / 5 users (best value in India)
- **Google Workspace** — ₹136+/user/month
- Add the MX records Zoho/Google give you in Cloudflare DNS.

---

## STEP 4 — After going live

- [ ] Test on a real phone (not just a resized browser window)
- [ ] Submit the sitemap in [Google Search Console](https://search.google.com/search-console)
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) — should score 95+
- [ ] Add analytics — Cloudflare Web Analytics is free and cookie-less
- [ ] Write real Privacy Policy and Terms pages (footer links are placeholders)
- [ ] Replace the placeholder stats/claims in the "Why us" section with true numbers
- [ ] Add a Projects/Case Studies section once you have client work

## Notes

- Claims like "99.9% uptime", "15+ years combined experience", "24x7 monitoring"
  are placeholder marketing copy. Edit them to match what the company can
  actually deliver — India's Consumer Protection Act treats false advertising
  as a real liability.
- The site is dark-theme only by design. If you want a light mode later, the
  colours are all CSS variables at the top of `styles.css`.
