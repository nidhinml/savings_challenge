# Free Tier Hosting Guide for SaveSmart PWA 🌐🚀

SaveSmart is built as an offline-first, client-side Progressive Web App (PWA). It does not require any paid servers, databases, or accounts.

You can host this application completely **100% FREE FOREVER** on several top-tier cloud platforms.

---

## ⚡ Option 1: Vercel (Recommended — Fastest & Easiest)

Vercel provides a generous **Hobby (Free)** tier with 100 GB monthly bandwidth, unlimited deployments, automatic HTTPS/SSL, and full PWA support.

### Method A: One-Click Web Deployment (No CLI needed)
1. Push your repository to **GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/savings_challenge.git
   git push -u origin master
   ```
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Click **"Add New..."** → **"Project"**.
4. Import your `savings_challenge` repository.
5. Vercel will automatically detect **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click **"Deploy"**.
7. In ~30 seconds, your PWA is live at `https://<your-project>.vercel.app`!

### Method B: Deploy using Vercel CLI directly from terminal
```bash
npx vercel
```
- Follow the interactive prompts (select defaults).
- To deploy to production:
```bash
npx vercel --prod
```

---

## 🍃 Option 2: Netlify (100% Free)

Netlify offers 100 GB monthly bandwidth and 300 free build minutes.

### Method A: Web Interface
1. Push to GitHub.
2. Go to [netlify.com](https://www.netlify.com/) and click **"Add new site"** → **"Import an existing project"**.
3. Select your GitHub repository.
4. Settings are pre-configured via the included [`netlify.toml`](./netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **"Deploy site"**.
6. Your app is live at `https://<your-site>.netlify.app`!

### Method B: Terminal Deploy
```bash
npx netlify deploy --prod
```

---

## ⚡ Option 3: Cloudflare Pages (Free with Unlimited Bandwidth)

Cloudflare Pages provides completely free static hosting with **unlimited bandwidth** and global CDN edge routing.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** → **Pages** → **Connect to Git**.
3. Select the `savings_challenge` repository.
4. Framework preset: **Vite**.
5. Build command: `npm run build`
6. Build output directory: `dist`
7. Click **Save and Deploy**.

---

## 🐙 Option 4: GitHub Pages (100% Free)

To deploy directly to your GitHub repository's `gh-pages`:

1. Install `gh-pages` helper (if needed):
   ```bash
   npm i -D gh-pages
   ```
2. In `vite.config.ts`, set the base path to `'/'` or `'/<repo-name>/'`.
3. Run:
   ```bash
   npm run build
   npx gh-pages -d dist
   ```

---

## 🔒 Security & Data Privacy

Because SaveSmart utilizes **IndexedDB** inside the user's browser:
- All financial numbers and savings challenges remain **100% private on the user's device**.
- No sensitive user data is sent across the wire to hosting providers.
- Works seamlessly offline once installed.
