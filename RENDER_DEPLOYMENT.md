# Deploying Food Tracker to Render with PostgreSQL

This guide will help you deploy your Food Tracker application to Render with a persistent PostgreSQL database.

## Why PostgreSQL?

Previously, the app used SQLite which stores data in a file. On Render's free tier, files are ephemeral and get deleted when the server restarts, causing data loss. PostgreSQL solves this by storing data in a separate, persistent database service.

## Prerequisites

- GitHub account with your Food Tracker repository
- Render account (free tier works!)

## Step 1: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Log in to your account

2. **Create New PostgreSQL Database**
   - Click the **"New +"** button in the top right
   - Select **"PostgreSQL"**

3. **Configure Database**
   - **Name**: `food-tracker-db` (or any name you prefer)
   - **Database**: `food_tracker` (database name)
   - **User**: Leave default (will be auto-generated)
   - **Region**: Choose closest to you (e.g., Oregon (US West))
   - **PostgreSQL Version**: 16 (or latest)
   - **Datadog API Key**: Leave blank
   - **Plan**: Select **"Free"** plan

4. **Create Database**
   - Click **"Create Database"**
   - Wait 2-3 minutes for database to provision
   - You'll see it appear in your dashboard

5. **Get Connection String**
   - Click on your newly created database
   - Scroll down to **"Connections"** section
   - Look for **"Internal Database URL"** (this is important!)
   - Click the copy icon to copy the connection string
   - It will look like: `postgresql://food_tracker_db_user:xxxxx@dpg-xxxxx/food_tracker_db`
   - **Keep this safe!** You'll need it in Step 3

## Step 2: Deploy Backend to Render

1. **Create New Web Service**
   - Go back to Render Dashboard
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Click **"Connect a repository"**
   - If you haven't connected GitHub yet, authorize Render to access your repositories
   - Find and select your `Food-Tracker` repository
   - Click **"Connect"**

3. **Configure Web Service**
   Fill in the following settings:

   - **Name**: `food-tracker-backend` (or any name)
   - **Region**: Same as database (e.g., Oregon US West)
   - **Branch**: `main` (or your primary branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select **"Free"**

4. **Add Environment Variables**
   Scroll down to **"Environment Variables"** section and add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `JWT_SECRET` | `your-secret-key-here` (generate a random string) |
   | `DATABASE_URL` | Paste the **Internal Database URL** from Step 1 |

   **Important**: Use the **Internal Database URL**, not the External URL. Internal connections are free and faster.

5. **Create Web Service**
   - Click **"Create Web Service"**
   - Render will start building and deploying your backend
   - This takes 5-10 minutes for the first deployment
   - Watch the logs for any errors

6. **Verify Deployment**
   - Once deployed, you'll see a URL like: `https://food-tracker-backend-xxxx.onrender.com`
   - Visit: `https://food-tracker-backend-xxxx.onrender.com/api/health`
   - You should see: `{"status":"ok","message":"Food Tracker API is running"}`
   - If you see ✅ "Connected to PostgreSQL database" and ✅ "Database schema initialized successfully" in the logs, you're good!

## Step 3: Deploy Frontend to Vercel (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com/
   - Log in with GitHub

2. **Import Project**
   - Click **"Add New..." → "Project"**
   - Find your `Food-Tracker` repository
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

4. **Add Environment Variable**
   - Click **"Environment Variables"**
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://food-tracker-backend-xxxx.onrender.com/api` (your backend URL + `/api`)

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - You'll get a URL like: `https://food-tracker-xxxxx.vercel.app`

6. **Test the Application**
   - Visit your Vercel URL
   - Try adding a weight entry
   - The data should now persist even after the backend restarts!

## Step 4: Prevent Backend from Spinning Down

Render's free tier spins down after 15 minutes of inactivity. Your GitHub Actions workflow (already set up in `.github/workflows/keep-alive.yml`) will prevent this by pinging your backend every 10 minutes.

**Set up the GitHub Actions workflow:**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `BACKEND_URL`
   - **Value**: `https://food-tracker-backend-xxxx.onrender.com/api/health`
5. The workflow will automatically start running!

## Troubleshooting

### Backend fails to start

**Check logs in Render dashboard:**
- Look for database connection errors
- Verify `DATABASE_URL` is set correctly
- Make sure you used the **Internal Database URL**, not External

### Database connection errors

**Common issues:**
- Wrong connection string format
- Using External URL instead of Internal URL
- Database not fully provisioned (wait a few minutes)

### Frontend can't connect to backend

**Check:**
- `VITE_API_URL` in Vercel environment variables
- Backend health endpoint is accessible: `https://your-backend.onrender.com/api/health`
- CORS is enabled (it should be by default)

### Data still disappearing

**Verify:**
- You're using PostgreSQL, not SQLite (check backend logs for "Connected to PostgreSQL")
- Database schema was initialized (check logs for "Database schema initialized successfully")
- Connection string is correct

## Cost Summary

**Free Tier Limits:**

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Render PostgreSQL** | Free | $0 | 1 GB storage, 97 hours/month compute |
| **Render Web Service** | Free | $0 | Spins down after 15 min, 750 hours/month |
| **Vercel** | Hobby | $0 | 100 GB bandwidth, unlimited sites |
| **GitHub Actions** | Free | $0 | 2000 minutes/month (using ~30 min/month) |

**Total Monthly Cost: $0** ✅

The PostgreSQL free tier is perfect for personal use. If you exceed the 97 hours compute time, your database will stop temporarily until the next billing cycle, but your data remains safe.

## Upgrading (Optional)

If you need more reliability or usage:

- **Render PostgreSQL**: $7/month for Starter plan (unlimited compute, better performance)
- **Render Web Service**: $7/month (always on, no spin down)

## Next Steps

1. **Add More Data**: Your weight entries and food diary will now persist permanently
2. **Share Your App**: Send the Vercel URL to friends and family
3. **Monitor Usage**: Check Render dashboard to see database usage

## Support

If you run into issues:
- Check Render logs: Click your service → "Logs" tab
- Check Vercel logs: Click your project → "Deployments" → select deployment → "View Build Logs"
- Verify environment variables are set correctly

---

**Congratulations!** 🎉 Your Food Tracker now has persistent data storage with PostgreSQL!
