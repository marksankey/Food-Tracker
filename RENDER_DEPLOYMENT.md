# Deploying Food Tracker with Supabase PostgreSQL + Render

This guide will help you deploy your Food Tracker application using **Supabase** for free PostgreSQL database (no expiration!) and **Render** for hosting the backend.

## Why This Setup?

- **Supabase PostgreSQL**: Free forever, 500MB storage, no 90-day expiration
- **Render Backend**: Free hosting with auto-deploy from GitHub
- **Vercel Frontend**: Free hosting with CDN and automatic deployments

## Prerequisites

- GitHub account with your Food Tracker repository
- Supabase account (free)
- Render account (free)
- Vercel account (free)

---

## Step 1: Create Free PostgreSQL Database on Supabase

### 1.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `food-tracker-db` (or any name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `us-west-1`)
   - **Pricing Plan**: **Free** (includes 500MB database, no expiration)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the database to provision

### 1.3 Get Database Connection String

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click **"Database"** in the left menu
3. Scroll down to **"Connection string"** section
4. Select **"URI"** tab (not Transaction or Session)
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you created in step 1.2
7. **Save this connection string** - you'll need it in Step 2

**Example connection string:**
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com/)
2. Log in or sign up (use GitHub for easy setup)
3. Click **"New +"** → **"Web Service"**

### 2.2 Connect Repository

1. Click **"Connect a repository"**
2. If needed, authorize Render to access your GitHub
3. Find and select your `Food-Tracker` repository
4. Click **"Connect"**

### 2.3 Configure Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `food-tracker-backend` |
| **Region** | Same as Supabase (e.g., Oregon US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

### 2.4 Add Environment Variables

**⚠️ CRITICAL:** You must set these environment variables or deployment will fail.

Scroll down to **"Environment Variables"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets environment to production |
| `PORT` | `5000` | Port for the backend server |
| `JWT_SECRET` | `your-random-secret-here` | Generate a random 32+ character string |
| `DATABASE_URL` | `postgresql://postgres:...` | **⚠️ REQUIRED: Paste your Supabase connection string from Step 1.3** |

**⚠️ IMPORTANT:** The `DATABASE_URL` is **REQUIRED**. Without it, your deployment will fail with `ECONNREFUSED` error. Make sure to:
- Copy the full connection string from Supabase (Step 1.3)
- Replace `[YOUR-PASSWORD]` with your actual database password
- The format must be: `postgresql://postgres:PASSWORD@HOST:5432/postgres`

**How to generate a secure JWT_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator
# Example: kJ9mP2xQ8nR5tY7wZ3vB6cF4gH1jL0sA
```

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Watch the logs - look for these success messages:
   - ✅ `Connected to PostgreSQL database`
   - ✅ `Database schema initialized successfully`
   - ✅ `Seeded 67 foods to the database` (first time only)
   - ✅ `Server is running on port 5000`
4. First deployment takes ~5-10 minutes

### 2.6 Get Your Backend URL

Once deployed, you'll see a URL like:
```
https://food-tracker-backend-xxxx.onrender.com
```

**Test it:**
- Visit: `https://food-tracker-backend-xxxx.onrender.com/api/health`
- You should see: `{"status":"ok","message":"Food Tracker API is running"}`

✅ If you see that, your backend is working!

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Sign Up and Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New..." → "Project"**
4. Find your `Food-Tracker` repository
5. Click **"Import"**

### 3.2 Configure Project

Vercel should auto-detect your settings, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |

### 3.3 Add Environment Variable

1. Expand **"Environment Variables"** section
2. Add this variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://food-tracker-backend-xxxx.onrender.com/api` |

Replace `xxxx` with your actual Render backend URL from Step 2.6

**Important:** Make sure to add `/api` at the end!

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://food-tracker-xxxxx.vercel.app`

### 3.5 Test Your Application

1. Visit your Vercel URL
2. Try adding a weight entry
3. Refresh the page - your data should still be there!
4. Your weight entries are now stored in Supabase and will persist forever ✅

---

## Step 4: Keep Backend Alive (GitHub Actions)

Your repository already has a GitHub Actions workflow to prevent Render from spinning down.

### 4.1 Add GitHub Secret

1. Go to your GitHub repository
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `BACKEND_URL`
   - **Value**: `https://food-tracker-backend-xxxx.onrender.com/api/health`
5. Click **"Add secret"**

The workflow will automatically ping your backend every 10 minutes to keep it awake.

---

## Verification Checklist

After deployment, verify everything works:

- [ ] Backend health endpoint responds: `your-backend-url/api/health`
- [ ] Frontend loads at your Vercel URL
- [ ] Can add weight entries
- [ ] Can view weight history
- [ ] Data persists after page refresh
- [ ] Can add food diary entries
- [ ] Profile page loads and saves

---

## Database Management (Supabase)

### View Your Data

1. Go to your Supabase project dashboard
2. Click **"Table Editor"** in the sidebar
3. You'll see all your tables:
   - `users`
   - `user_profiles`
   - `foods`
   - `food_diary`
   - `weight_logs`
4. Click any table to view/edit data directly

### Backups

Supabase free tier includes automatic backups:
- **Point-in-time recovery**: Last 7 days
- **Manual backups**: Export via SQL Editor

### Monitoring

1. Go to **"Database"** → **"Usage"**
2. Monitor:
   - Database size (500MB limit on free tier)
   - Active connections
   - Query performance

---

## Troubleshooting

### ❌ Error: DATABASE_URL environment variable is not set

**Symptoms:**
- Deployment logs show: `❌ FATAL ERROR: DATABASE_URL environment variable is not set`

**Fix:**
1. Go to Render dashboard → Your service → Environment
2. Add `DATABASE_URL` environment variable
3. Set the value to your Supabase connection string (see Step 1.3)
4. Redeploy by clicking "Manual Deploy" → "Deploy latest commit"

---

### ❌ Error: DATABASE_URL contains placeholder values

**Symptoms:**
- Deployment logs show: `❌ FATAL ERROR: DATABASE_URL contains placeholder values`
- Hostname shows: `db.xxxxx.supabase.co` or similar placeholder

**Cause:** You copied the example connection string instead of your actual Supabase connection string.

**Fix:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/database
2. Scroll to "Connection pooling" section (or "Connection string")
3. Copy the **actual** connection string (NOT the example from this guide)
4. Your hostname should look like: `db.abcdefghijklm.supabase.co` (with real letters/numbers, not "xxxxx")
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Update `DATABASE_URL` in Render environment variables
7. Redeploy

---

### ❌ Error: DNS lookup failed (ENOTFOUND)

**Symptoms:**
- Deployment logs show: `❌ DNS lookup failed for hostname: db.xxxxx.supabase.co`
- Error code: `ENOTFOUND`

**Cause:** The database hostname cannot be found.

**This usually means:**
1. The database hostname in `DATABASE_URL` is incorrect or contains placeholders
2. Your Supabase project might be paused or deleted
3. There is a network connectivity issue

**Fix:**

**Step 1: Verify your Supabase project is active**
- Go to https://supabase.com/dashboard
- Check your project status (should show "Active", not "Paused")
- If paused, click on the project to restore it

**Step 2: Get the correct DATABASE_URL**
1. In Supabase, go to **Project Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string - it will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with your actual database password (the one you set when creating the project)
6. The final string should look like:
   ```
   postgresql://postgres:MyActualPassword123@db.abcdefghijklm.supabase.co:5432/postgres
   ```

**Step 3: Update in Render**
1. Go to Render dashboard → Your service → Environment
2. Update `DATABASE_URL` with the corrected connection string
3. Click "Save Changes"
4. Redeploy: "Manual Deploy" → "Deploy latest commit"

---

### ❌ Error: password authentication failed

**Symptoms:**
- Deployment logs show: `❌ Authentication failed`
- Error message: `password authentication failed for user "postgres"`

**Cause:** The password in your DATABASE_URL is incorrect.

**Fix:**
1. Go to Supabase → **Project Settings** → **Database**
2. Scroll to **"Database password"** section
3. Click **"Reset database password"** to create a new password
4. Copy the new password
5. Update your DATABASE_URL with the new password:
   ```
   postgresql://postgres:NEW_PASSWORD@db.xxx.supabase.co:5432/postgres
   ```
6. Make sure there are NO brackets around the password (remove `[` and `]`)
7. Update `DATABASE_URL` in Render environment variables
8. Redeploy

---

### ❌ Error: ECONNREFUSED 127.0.0.1:5432

**Symptoms:**
- Deployment logs show: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Cause:** The application is trying to connect to localhost instead of Supabase.

**Fix:**
This indicates `DATABASE_URL` is not set at all. Follow the steps in "DATABASE_URL environment variable is not set" above.

---

### 🔍 Quick Verification Checklist

**Before deploying, check your DATABASE_URL:**

✅ **Correct format:**
```
postgresql://postgres:MyPassword123@db.abcdefghijklm.supabase.co:5432/postgres
```

❌ **Common mistakes:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres  ← Password placeholder
postgresql://postgres:MyPassword123@db.xxxxx.supabase.co:5432/postgres   ← Host placeholder
postgresql://postgres:MyPassword123@localhost:5432/postgres              ← Using localhost
```

**Good deployment logs should show:**
```
✅ Database URL configured
   Host: db.abcdefghijklm.supabase.co  ← Real project ID
   Port: 5432
   Database: postgres
🔄 Attempting to connect to database (attempt 1/5)...
✅ Successfully connected to database
✅ Database schema initialized successfully
✅ Server is running on port 5000
```

**Bad deployment logs:**
```
❌ FATAL ERROR: DATABASE_URL environment variable is not set
❌ FATAL ERROR: DATABASE_URL contains placeholder values
❌ DNS lookup failed for hostname: db.xxxxx.supabase.co
❌ Authentication failed
```

---

### Backend fails to start

**Check Render logs for errors:**

1. Go to Render dashboard → Your service
2. Click **"Logs"** tab
3. Look for error messages (see sections above for specific fixes)

**Common fixes:**
- Verify `DATABASE_URL` is correct (no placeholders, includes real password)
- Check Supabase project is active (not paused)
- Verify the connection string format matches the correct format above

### Database connection timeout

**Issue:** Backend can't connect to Supabase

**Solutions:**
1. Check Supabase project status (go to dashboard)
2. Verify connection string format:
   ```
   postgresql://postgres:PASSWORD@HOST:5432/postgres
   ```
3. Make sure you replaced `[YOUR-PASSWORD]` with actual password
4. Check Supabase isn't paused (free projects pause after 1 week of inactivity)

**Wake up paused project:**
- Go to Supabase dashboard
- Click your project
- It will automatically resume

### Frontend can't connect to backend

**Check:**
1. `VITE_API_URL` in Vercel environment variables
2. Should be: `https://your-backend.onrender.com/api` (with `/api`)
3. Redeploy frontend after changing environment variables

### Data not persisting

**Verify:**
1. Backend logs show: `✅ Connected to PostgreSQL database`
2. Not using SQLite (old database.ts should be updated)
3. Check Supabase Table Editor - data should appear there

---

## Costs & Limits

### Supabase Free Tier

| Resource | Limit | Your Usage |
|----------|-------|------------|
| **Database Storage** | 500 MB | ~1-10 MB (personal use) |
| **Bandwidth** | 2 GB/month | ~10-100 MB (personal use) |
| **Projects** | Unlimited | You only need 1 |
| **Expiration** | **Never** ✅ | No time limit |
| **Backups** | 7 days | Automatic |

**Pausing:** Projects pause after 1 week of inactivity. Just visit the dashboard to wake it up.

### Render Free Tier

| Resource | Limit |
|----------|-------|
| **Compute** | 750 hours/month |
| **Bandwidth** | 100 GB/month |
| **Spin Down** | After 15 min inactivity |
| **Build Time** | 500 min/month |

**With GitHub Actions keep-alive:** Your backend stays awake 24/7

### Vercel Free Tier

| Resource | Limit |
|----------|-------|
| **Bandwidth** | 100 GB/month |
| **Builds** | Unlimited |
| **Sites** | Unlimited |

### Total Monthly Cost

**$0** ✅ Everything is completely free!

---

## Scaling Up (Optional)

If you exceed free tier limits or want better performance:

### Supabase Pro ($25/month)
- 8 GB database storage
- 50 GB bandwidth
- Point-in-time recovery (up to 30 days)
- Daily backups
- Better performance

### Render Paid Plan ($7/month)
- Always-on (no spin down)
- Faster builds
- More compute power

### Keep Free Tier Longer

**Optimize database usage:**
1. Delete old food diary entries periodically
2. Remove duplicate foods
3. Archive old weight logs (export to CSV)

**Monitor usage:**
- Supabase: Dashboard → Database → Usage
- Render: Dashboard → Your service → Metrics

---

## Next Steps

1. ✅ Your app is deployed with persistent storage!
2. Share your Vercel URL with friends and family
3. Add weight entries - they'll persist forever
4. Consider adding custom foods and tracking meals

## Updating Your App

When you push changes to GitHub:

- **Backend (Render)**: Auto-deploys from `main` branch
- **Frontend (Vercel)**: Auto-deploys from `main` branch
- **Database (Supabase)**: Schema changes require migration

**To update database schema:**
1. Update your models in code
2. Push to GitHub (backend will redeploy)
3. On first startup, `initializeDatabase()` will run migrations

---

## Support

### Having issues?

1. **Check logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → Build logs
   - Supabase: Dashboard → Logs

2. **Common errors:**
   - `ECONNREFUSED`: Backend URL wrong in frontend
   - `password authentication failed`: Wrong database password
   - `relation does not exist`: Database not initialized

3. **Resources:**
   - Supabase Docs: [docs.supabase.com](https://supabase.com/docs)
   - Render Docs: [render.com/docs](https://render.com/docs)
   - Vercel Docs: [vercel.com/docs](https://vercel.com/docs)

---

**Congratulations!** 🎉

Your Food Tracker now has:
- ✅ Free PostgreSQL database (no expiration)
- ✅ Deployed backend on Render
- ✅ Deployed frontend on Vercel
- ✅ Persistent data storage
- ✅ Automatic deployments from GitHub

Your weight entries and food diary will now persist forever!
