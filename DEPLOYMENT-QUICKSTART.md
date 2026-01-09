# Deployment Quick Start

**5-minute deployment guide for Food Tracker**

---

## 🎯 Quick Links

- **Render**: https://dashboard.render.com/
- **Vercel CLI**: Install with `npm install -g vercel`
- **UptimeRobot**: https://uptimerobot.com

---

## 📋 Step-by-Step Checklist

### ☁️ Backend (Render) - 5 minutes

```bash
# Your app is ready - just deploy!
```

1. Go to https://dashboard.render.com/
2. **New +** → **Web Service**
3. Connect: `marksankey/Food-Tracker`
4. Settings:
   - **Root Directory**: `backend`
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
5. **Environment**:
   ```
   JWT_SECRET=<random-32-char-string>
   NODE_ENV=production
   DATABASE_PATH=./database/food-tracker.db
   ```
   Generate JWT: `openssl rand -base64 32`
6. **Create Web Service**
7. Wait for deployment (~3 min)
8. **Shell tab** → Run: `npm run seed`
9. Test: `https://your-app.onrender.com/api/health`
10. **Copy your URL** for next step ✍️

---

### 🌐 Frontend (Vercel) - 2 minutes

```bash
# Install Vercel
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel login
vercel

# Answer prompts:
# Project name: food-tracker
# Accept defaults
```

After deployment:

```bash
# Add backend URL
vercel env add VITE_API_URL
# Value: https://your-backend.onrender.com/api
# Environments: All (Production, Preview, Development)

# Redeploy with env var
vercel --prod
```

**Copy your Vercel URL** → Test in browser ✍️

---

### 🔔 UptimeRobot - 2 minutes

1. Go to https://uptimerobot.com → Sign up
2. **Add New Monitor**:
   - Type: **HTTP(s)**
   - Name: `Food Tracker Backend`
   - URL: `https://your-backend.onrender.com/api/health`
   - Interval: **5 minutes**
3. **Create Monitor**
4. Done! ✅ Your backend stays warm

---

### 📱 iPhone - 1 minute

1. Open **Safari** (must be Safari)
2. Go to your Vercel URL
3. Tap **Share** (square with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add**
6. Done! 🎉

---

## 🚀 You're Live!

Your app is now:
- ✅ Deployed on Render (backend)
- ✅ Deployed on Vercel (frontend)
- ✅ Staying warm with UptimeRobot
- ✅ On your iPhone home screen

**Total time**: ~10 minutes
**Total cost**: $0

---

## 🔄 Making Updates

### Update Backend
```bash
# Just push to GitHub
git push

# Render auto-deploys (if enabled)
# Or: Dashboard → Manual Deploy
```

### Update Frontend
```bash
cd frontend
vercel --prod
```

---

## 📝 Your URLs

Fill these in after deployment:

```
Backend:  https://_________________________.onrender.com
Frontend: https://_________________________.vercel.app
Health:   https://_________________________.onrender.com/api/health
```

---

## ❓ Quick Troubleshooting

**Backend not responding?**
- Check Render logs: Dashboard → Service → Logs
- Run seed: Dashboard → Service → Shell → `npm run seed`

**Frontend can't connect?**
- Check env var: `vercel env ls`
- Must have: `VITE_API_URL` set
- Redeploy: `vercel --prod`

**Slow startup?**
- Wait 15 seconds on first load (cold start)
- UptimeRobot will prevent this after setup

**iPhone issues?**
- Must use Safari browser
- Tap Share → Add to Home Screen
- Launch from home screen icon (not Safari)

---

## 📚 Need More Details?

See **DEPLOYMENT.md** for:
- Complete step-by-step guide
- Troubleshooting section
- Security notes
- Cost breakdown

---

**Happy tracking! 🍎**
