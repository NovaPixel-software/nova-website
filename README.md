# NovaPixel Software: Website

Company website for **NovaPixel Software** (Software & Automation), Kaggadasapura, Bengaluru 560093.
Static site (HTML + CSS + vanilla JS), no build step.

```
public/
├── index.html            # single page: hero, services, our work, process, about, contact
├── contact.php           # contact form mailer (only runs on PHP hosting, e.g. Hostinger)
├── 404.html              # not-found page
├── robots.txt, sitemap.xml
├── _headers              # security + cache headers (Cloudflare Pages / Netlify)
└── assets/
    ├── css/style.css     # brand colours, layout, responsive rules
    ├── js/main.js        # nav, mobile menu, scroll reveal, contact form
    └── img/              # logo, favicon, portfolio screenshots, share image
```

## Contact details used on the site
- Email: support@novapixelsoftware.com
- Phone / WhatsApp: +91 93805 21886
- Address: Kaggadasapura, Bengaluru, Karnataka 560093
- Hours: Monday to Saturday, 9:00 AM to 7:00 PM
- Instagram: https://www.instagram.com/novapixelsoftware/

## Run locally
Double-click `public/index.html`, or serve the folder:

```powershell
cd public
python -m http.server 8000   # then open http://localhost:8000
```

## Contact form
- **PHP hosting (Hostinger):** `contact.php` emails every enquiry to support@novapixelsoftware.com.
- **Static hosting (GitHub Pages / Cloudflare Pages / Netlify):** PHP doesn't run, so the form
  automatically opens the visitor's email app with the enquiry pre-filled to support@.

## Deploy
- **Hostinger:** upload the contents of `public/` into `public_html`.
- **GitHub Pages / Cloudflare Pages:** publish the `public/` folder. Pushing to `main` redeploys.

See `DEPLOYMENT.md` for the full infrastructure runbook.
