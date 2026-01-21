# GitHub Actions - Keep Apps Alive

This workflow automatically pings your deployed applications every 10 minutes to prevent Render from spinning down due to inactivity.

## How It Works

- **Runs**: Every 10 minutes, 24/7 on GitHub's servers
- **What it does**: Pings your backend health endpoint
- **Cost**: Free (included in GitHub's free tier)
- **Maintenance**: Zero - just set it up once

## Setup Instructions

### Step 1: Deploy Your Apps First

Make sure you've deployed:
1. **Backend** to Render (see DEPLOYMENT.md)
2. **Frontend** to Vercel (see DEPLOYMENT.md)

You should have URLs like:
- Backend: `https://food-tracker-backend-xxxx.onrender.com`
- Frontend: `https://food-tracker-xxxx.vercel.app`

### Step 2: Add GitHub Secrets

GitHub secrets keep your URLs secure and out of the code.

1. **Go to your GitHub repository**
   - Navigate to: https://github.com/marksankey/Food-Tracker

2. **Open Settings**
   - Click **Settings** tab (top right)

3. **Navigate to Secrets**
   - Click **Secrets and variables** (left sidebar)
   - Click **Actions**

4. **Add Backend URL** (Required)
   - Click **New repository secret**
   - Name: `BACKEND_URL`
   - Value: `https://your-backend.onrender.com/api/health`
   - Click **Add secret**

5. **Add Frontend URL** (Optional)
   - Click **New repository secret**
   - Name: `FRONTEND_URL`
   - Value: `https://your-frontend.vercel.app`
   - Click **Add secret**

   Note: Vercel doesn't spin down, so this is optional - mainly useful for monitoring.

### Step 3: Push This Workflow to GitHub

```bash
git add .github/
git commit -m "Add GitHub Actions workflow to keep apps alive"
git push
```

### Step 4: Verify It's Working

1. Go to your repository on GitHub
2. Click the **Actions** tab (top menu)
3. You should see "Keep Apps Alive" workflow listed
4. Click on it to see the schedule and run history

**To test it immediately:**
- Click **Run workflow** button (manual trigger)
- Click the green **Run workflow** button
- Watch it execute in real-time!

## Monitoring

### View Workflow Runs

- Go to: **Actions** tab > **Keep Apps Alive**
- See all past runs (success/failure)
- Click any run to see detailed logs

### Check Run Status

✅ **Green checkmark** = Backend is responding
❌ **Red X** = Backend is down or not configured
🟡 **Yellow dot** = Currently running

### Troubleshooting

**Problem: Workflow fails with "BACKEND_URL secret not set"**
- Solution: Add the `BACKEND_URL` secret (see Step 2 above)

**Problem: Workflow returns HTTP 404**
- Solution: Check your backend health endpoint exists at `/api/health`
- Test manually: `curl https://your-backend.onrender.com/api/health`

**Problem: Workflow doesn't run automatically**
- Solution: Wait 10 minutes after first push - GitHub needs to activate the schedule
- Or trigger manually: Actions tab > Keep Apps Alive > Run workflow

**Problem: "This workflow has no runs yet"**
- Solution: The first run happens after you push to GitHub
- Trigger it manually to test immediately

## Schedule Details

- **Frequency**: Every 10 minutes
- **Cron expression**: `*/10 * * * *`
- **Time zone**: UTC
- **Why 10 minutes?**: Render spins down after 15 minutes of inactivity. Pinging every 10 minutes keeps it awake with a safety margin.

## Customization

### Change Ping Frequency

Edit `.github/workflows/keep-alive.yml` line 6:

```yaml
# Every 5 minutes
- cron: '*/5 * * * *'

# Every 15 minutes
- cron: '*/15 * * * *'

# Every hour
- cron: '0 * * * *'
```

Note: Minimum interval is 5 minutes on GitHub Actions.

### Add More Endpoints

You can ping additional endpoints by adding more steps in the workflow file.

## Cost

**GitHub Actions Free Tier:**
- 2,000 minutes/month for private repos
- Unlimited for public repos
- This workflow uses ~1 minute per day
- **Cost: $0** ✅

## Benefits vs UptimeRobot

| Feature | GitHub Actions | UptimeRobot |
|---------|----------------|-------------|
| **Cost** | Free | Free |
| **Setup** | Automated | Manual |
| **Maintenance** | None | None |
| **Dependencies** | GitHub only | External service |
| **Reliability** | High | High |
| **Monitoring** | GitHub Actions tab | UptimeRobot dashboard |
| **Code-based** | ✅ Lives in repo | ❌ External config |

Both work great! This GitHub Actions approach is preferred because it's automated and lives with your code.

## Questions?

- See main **DEPLOYMENT.md** for full deployment guide
- Check **Actions** tab for workflow status
- View workflow logs for debugging

---

**Status**: 🟢 Active - Keeping your apps warm 24/7
