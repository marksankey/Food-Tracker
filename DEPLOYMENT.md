# Food Tracker - Deployment Guide

Complete guide to deploying Food Tracker on Render (backend) and Vercel (frontend), optimized for iPhone access.

## Overview

- **Backend**: Render.com (with UptimeRobot keep-alive)
- **Frontend**: Vercel
- **Database**: SQLite (persisted on Render)
- **Cost**: $0 (completely free)

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

Your backend is ready! Just verify these files exist:
- ✅ `backend/package.json` - Build and start scripts configured
- ✅ `backend/.env.example` - Environment variable template
- ✅ `backend/src/index.ts` - Health check endpoint at `/api/health`

### Step 2: Deploy to Render

Since you already have a Render account:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `marksankey/Food-Tracker`
   - Grant Render access if needed

3. **Configure Service**
   ```
   Name: food-tracker-backend
   Region: Choose closest to you (e.g., Oregon/Frankfurt)
   Branch: main (or your preferred branch)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Set Environment Variables**
   Click "Environment" tab and add:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<generate-random-string>
   DATABASE_PATH=./database/food-tracker.db
   ```

   **Generate JWT Secret** (use one of these methods):
   - Run in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Or use: `openssl rand -base64 32`
   - Or visit: https://www.uuidgenerator.net/

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait 3-5 minutes for initial deployment
   - You'll get a URL like: `https://food-tracker-backend-xxxx.onrender.com`

6. **Verify Backend is Running**
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should see: `{"status":"ok","message":"Food Tracker API is running"}`

7. **Important: Initialize Database**

   After first deployment, you need to seed the database. On Render:
   - Go to your service
   - Click "Shell" tab (left sidebar)
   - Run: `npm run seed`
   - This creates the database and adds 60+ foods

   **Note**: The database will persist between deployments as long as you don't delete the service.

### Step 3: Save Your Backend URL

Copy your Render backend URL (something like):
```
https://food-tracker-backend-xxxx.onrender.com
```

You'll need this for frontend deployment!

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

Open your terminal:

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate. Sign in with:
- GitHub (recommended - easiest)
- Email
- GitLab, or Bitbucket

### Step 3: Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Deploy
vercel
```

You'll be asked several questions:

**Question 1: Set up and deploy?**
```
? Set up and deploy "~/Food-Tracker/frontend"? [Y/n]
Answer: Y
```

**Question 2: Which scope?**
```
? Which scope do you want to deploy to?
Answer: Select your personal account
```

**Question 3: Link to existing project?**
```
? Link to existing project? [y/N]
Answer: N
```

**Question 4: Project name?**
```
? What's your project's name? (frontend)
Answer: food-tracker (or press Enter for default)
```

**Question 5: Directory?**
```
? In which directory is your code located? ./
Answer: Press Enter (current directory)
```

**Vercel will auto-detect Vite and use these settings:**
```
Auto-detected Project Settings (Vite):
- Build Command: vite build
- Output Directory: dist
- Development Command: vite
```

**Question 6: Override settings?**
```
? Want to override the settings? [y/N]
Answer: N
```

### Step 4: Add Environment Variables

After deployment completes, add your backend URL:

```bash
# Set the API URL to your Render backend
vercel env add VITE_API_URL

# When prompted:
? What's the value of VITE_API_URL?
Answer: https://your-backend-url.onrender.com/api

? Add VITE_API_URL to which Environments?
Answer: Select all (Production, Preview, Development)
```

### Step 5: Redeploy with Environment Variable

```bash
vercel --prod
```

This redeploys with the environment variable included.

### Step 6: Get Your Frontend URL

After deployment, Vercel will show:
```
✅  Production: https://food-tracker-xxxx.vercel.app
```

**Test it:**
1. Visit your Vercel URL
2. Try to register/login
3. If it works, you're done! 🎉

---

## Part 3: Keep Backend Alive (Prevent Spin-Down)

Render's free tier spins down your backend after 15 minutes of inactivity. Choose one of these solutions:

### Option A: GitHub Actions (Recommended) 🤖

**Fully automated, no external services needed!**

This workflow runs on GitHub's servers and pings your backend every 10 minutes.

#### Step 1: Add GitHub Secrets

1. Go to your repository: https://github.com/marksankey/Food-Tracker
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `BACKEND_URL`
   - **Value**: `https://your-backend.onrender.com/api/health`
5. Click **Add secret**

#### Step 2: Push Workflow (If Not Already Done)

The workflow file already exists in `.github/workflows/keep-alive.yml`. Just push it:

```bash
git add .github/
git commit -m "Add keep-alive workflow"
git push
```

#### Step 3: Verify

1. Go to your repository > **Actions** tab
2. Find "Keep Apps Alive" workflow
3. Click **Run workflow** to test immediately
4. Check the logs - should see ✅ success

**Done!** GitHub will now ping your backend every 10 minutes automatically. 24/7. Forever. For free. 🎉

📖 **Detailed guide**: See `.github/workflows/README.md` for full documentation.

---

### Option B: UptimeRobot (Manual Alternative)

If you prefer a dedicated monitoring service:

#### Step 1: Create UptimeRobot Account

1. Go to https://uptimerobot.com
2. Click "Sign Up Free"
3. Create account (100% free, no credit card needed)

#### Step 2: Add Monitor

1. Click "Add New Monitor"
2. Configure:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Food Tracker Backend
   URL: https://your-backend-url.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```
3. Click "Create Monitor"

#### Step 3: Verify

- UptimeRobot will ping your backend every 5 minutes
- This keeps Render awake and responsive
- Your app will now load instantly! ⚡

---

**Which option to choose?**
- ✅ **GitHub Actions**: Automated, lives in your code, no external dependencies
- ✅ **UptimeRobot**: Separate monitoring dashboard, email alerts available

Both work great! We recommend GitHub Actions for simplicity.

---

## Part 4: Add to iPhone

### Step 1: Open in Safari

1. Open **Safari** on your iPhone (must be Safari, not Chrome)
2. Go to your Vercel URL: `https://food-tracker-xxxx.vercel.app`

### Step 2: Add to Home Screen

1. Tap the **Share button** (square with arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Edit the name if you want (e.g., "Food Tracker")
4. Tap **"Add"**

### Step 3: Launch App

- The Food Tracker icon will appear on your home screen
- Tap it to launch
- It will open full-screen like a native app!

---

## Deployment Checklist

### Backend (Render)
- [ ] Service created and deployed
- [ ] Environment variables set (JWT_SECRET, etc.)
- [ ] Database seeded with `npm run seed`
- [ ] Health check working: `/api/health`
- [ ] Backend URL copied for frontend

### Frontend (Vercel)
- [ ] Deployed with `vercel --prod`
- [ ] Environment variable set: `VITE_API_URL`
- [ ] Can access app in browser
- [ ] Registration/login works
- [ ] Can add foods to diary

### Keep-Alive (Choose One)
**Option A: GitHub Actions (Recommended)**
- [ ] Added `BACKEND_URL` secret to GitHub repository
- [ ] Pushed workflow to GitHub
- [ ] Verified workflow runs in Actions tab

**Option B: UptimeRobot**
- [ ] Account created
- [ ] Monitor added for backend health check
- [ ] Set to check every 5 minutes

### iPhone
- [ ] App added to home screen via Safari
- [ ] App launches full-screen
- [ ] All features work on mobile

---

## Updating Your App

### Update Backend
1. Push changes to GitHub
2. Render auto-deploys (if auto-deploy enabled)
3. Or manually: Dashboard → Service → "Manual Deploy" → "Deploy latest commit"

### Update Frontend
```bash
cd frontend
vercel --prod
```

Changes go live in ~30 seconds!

---

## Troubleshooting

### Backend Issues

**Problem: Health check returns 404**
- Solution: Make sure build command ran successfully
- Check Render logs: Dashboard → Service → Logs

**Problem: Database not working**
- Solution: Run `npm run seed` in Render Shell
- Go to: Dashboard → Service → Shell tab

**Problem: CORS errors**
- Solution: Backend has `cors()` enabled for all origins
- Should work by default

### Frontend Issues

**Problem: Can't connect to backend**
- Check environment variable: `vercel env ls`
- Should show: `VITE_API_URL=https://your-backend.onrender.com/api`
- Redeploy: `vercel --prod`

**Problem: Environment variables not working**
- Remember: Vite requires `VITE_` prefix
- After changing env vars, always redeploy

**Problem: Build fails**
- Check TypeScript errors: `npm run build`
- Fix errors locally first
- Then deploy again

### iPhone Issues

**Problem: App not appearing on home screen**
- Must use Safari browser (not Chrome/Firefox)
- Must tap Share → Add to Home Screen

**Problem: App opens in browser tab**
- Make sure you launched from home screen icon
- Not from Safari bookmarks

**Problem: Slow to load**
- Check UptimeRobot is running
- Render may still be warming up (first 10-15 seconds)
- After warm-up, should be instant

---

## URLs Reference

After deployment, save these URLs:

```
Backend (Render):  https://food-tracker-backend-xxxx.onrender.com
Frontend (Vercel): https://food-tracker-xxxx.vercel.app
Health Check:      https://food-tracker-backend-xxxx.onrender.com/api/health
```

---

## Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Render | Free | $0 | 750 hrs/month, spins down after 15min |
| Vercel | Free | $0 | 100 GB bandwidth, unlimited deployments |
| UptimeRobot | Free | $0 | 50 monitors, 5-min intervals |
| **Total** | | **$0/month** | Perfect for personal use |

### Upgrade Options (Optional)

If you want instant startup and use the app heavily:

**Render Starter**: $7/month
- No spin-down
- Always-on
- Instant response

**Vercel Pro**: $20/month (not needed for personal use)
- More bandwidth
- Better analytics

---

## Security Notes

### Production Checklist
- ✅ JWT_SECRET is random and secure
- ✅ Passwords hashed with bcrypt
- ✅ Environment variables not in code
- ✅ HTTPS enabled (automatic on Render/Vercel)
- ✅ SQL injection prevention (prepared statements)

### What's NOT Included (but could be added)
- Rate limiting (prevent spam)
- Email verification
- Two-factor authentication
- Session management (logout on all devices)

These are advanced features - not needed for personal use.

---

## Need Help?

Common commands:

```bash
# Check Vercel deployments
vercel ls

# View Vercel logs
vercel logs

# Remove deployment
vercel rm food-tracker

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

For Render:
- View logs in Dashboard → Service → Logs
- Access shell in Dashboard → Service → Shell
- Manual deploy in Dashboard → Service → Manual Deploy

---

**Next Steps:**
1. Follow Part 1 to deploy backend
2. Follow Part 2 to deploy frontend
3. Follow Part 3 to set up UptimeRobot
4. Follow Part 4 to add to iPhone
5. Start tracking your food! 🍎

Happy tracking! 🎉
