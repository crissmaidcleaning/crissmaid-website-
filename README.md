# Criss Maid Cleaning — Website Deploy Guide

## What's in this folder
```
crissmaid-website/
├── public/
│   └── logo.png          ← Your business logo
├── src/
│   ├── App.jsx           ← All your website code
│   └── main.jsx          ← App entry point
├── index.html            ← Website shell
├── package.json          ← Project config
├── vite.config.js        ← Build config
├── vercel.json           ← Hosting config
└── README.md             ← This file
```

---

## Step 1 — Buy your domain
1. Go to https://www.namecheap.com
2. Search: `crissmaidcleaning.com`
3. Add to cart and purchase (~$10–15/year)
4. Create an account and complete checkout

---

## Step 2 — Deploy to Vercel (Free)
1. Go to https://vercel.com and click **Sign Up** (use your Gmail)
2. Once logged in, click **"Add New Project"**
3. Click **"Upload"** or drag and drop this entire folder
4. Leave all settings as-is and click **Deploy**
5. In ~1 minute your site will be live at a link like:
   `https://crissmaid-cleaning.vercel.app`

---

## Step 3 — Connect crissmaidcleaning.com
1. In Vercel, open your project → click **Settings** → **Domains**
2. Type `crissmaidcleaning.com` and click **Add**
3. Vercel will show you two DNS values — copy them
4. Go back to Namecheap → **Domain List** → **Manage** → **Advanced DNS**
5. Delete existing A/CNAME records and add Vercel's values
6. Wait 30–60 minutes — your site is now live at **crissmaidcleaning.com** 🎉

---

## How to update your website in the future
1. Come back to Claude and ask for any changes
2. Download the new `App.jsx` file Claude gives you
3. Replace the `src/App.jsx` file in this folder with the new one
4. Go to Vercel → your project → **Deployments** → drag and drop the folder again
5. Done — the live site updates instantly!

---

## Need help?
📱 If you get stuck on any step, the Vercel support chat at vercel.com is very helpful.
