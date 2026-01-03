# 🍎 Food Tracker

A comprehensive food tracking application based on Slimming World principles. Track your daily syn intake, manage meals, monitor weight progress, and achieve your health goals.

## ✨ Features

### Core Features (MVP)
- **User Authentication**: Secure registration and login system
- **Food Database**: Searchable database with 60+ pre-loaded foods
  - Free Foods (0 syns)
  - Speed Foods (fruits & vegetables)
  - Healthy Extras A & B
  - Regular foods with syn values
- **Daily Food Diary**: Log meals by category (breakfast, lunch, dinner, snacks)
- **Syn Tracking**: Real-time daily syn counter with visual progress
- **Weight Tracker**: Log and track weight over time with progress charts
- **Dashboard**: Quick overview of daily intake and progress
- **User Profile**: Customize your daily syn allowance and goals

### Slimming World Principles Supported
- ✅ Syn value tracking (default 15 syns/day, customizable)
- ✅ Free Foods identification
- ✅ Speed Foods tracking
- ✅ Healthy Extra A (dairy) tracking
- ✅ Healthy Extra B (fiber) tracking
- ✅ Portion size calculations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/marksankey/Food-Tracker.git
   cd Food-Tracker
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   Edit `.env` and update if needed:
   ```
   PORT=5000
   JWT_SECRET=your-secret-key-change-this-in-production
   NODE_ENV=development
   DATABASE_PATH=./database/food-tracker.db
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

   The default `.env` should work:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Initialize and seed the database**
   ```bash
   cd ../backend
   npm run seed
   ```

   This will create the database and populate it with 60+ common foods.

5. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 Usage Guide

### Getting Started

1. **Register an Account**
   - Navigate to http://localhost:3000
   - Click "Register here"
   - Fill in your details and create an account

2. **Set Up Your Profile**
   - After registration, you'll be redirected to your profile
   - Enter your:
     - Starting weight
     - Current weight
     - Target weight
     - Height (optional, for BMI calculation)
     - Daily syn allowance (default: 15)

3. **Start Tracking**
   - Go to "Food Diary" to log your meals
   - Search the food database
   - Add foods to your meals
   - Track your daily syn intake on the Dashboard

### Daily Workflow

1. **Morning**: Log your breakfast
2. **Throughout the day**: Add meals and snacks as you consume them
3. **Check Dashboard**: Monitor your syn usage and make sure you're on track
4. **Weekly Weigh-In**: Record your weight in the Weight Tracker

### Tips for Success

- **Use Speed Foods**: Aim for 1/3 of each meal to be speed foods (fruits/vegetables)
- **Track Healthy Extras**: Make sure to use your daily Healthy Extra A & B allowances
- **Stay Within Syns**: Monitor your daily syn allowance to stay on track
- **Regular Weigh-Ins**: Log your weight weekly to track progress

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules
- **Charts**: Chart.js (for weight tracking)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt

### Database Schema
- `users` - User accounts
- `user_profiles` - User health profiles and settings
- `foods` - Food database with syn values
- `food_diary` - Daily meal entries
- `weight_logs` - Weight tracking history

## 📁 Project Structure

```
food-tracker/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API service layer
│   │   ├── store/      # State management (Context)
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   └── package.json
├── backend/            # Express backend API
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── models/     # Database models
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth middleware
│   │   ├── config/     # Database config
│   │   └── utils/      # Utilities & seed data
│   └── package.json
├── database/           # SQLite database (generated)
└── docs/              # Documentation

```

## 🔧 Available Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
npm run seed     # Initialize database and seed with foods
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Foods
- `GET /api/foods` - Get all foods
- `GET /api/foods/search?q=chicken` - Search foods
- `GET /api/foods/:id` - Get food by ID
- `POST /api/foods` - Create custom food

### Food Diary
- `GET /api/diary?date=2024-01-01` - Get entries for date
- `GET /api/diary/summary?date=2024-01-01` - Get daily summary
- `POST /api/diary` - Add diary entry
- `PUT /api/diary/:id` - Update entry
- `DELETE /api/diary/:id` - Delete entry

### Weight Logs
- `GET /api/weight` - Get all weight logs
- `POST /api/weight` - Add weight log
- `PUT /api/weight/:id` - Update weight log
- `DELETE /api/weight/:id` - Delete weight log

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication (7-day expiry)
- Environment variables for sensitive data
- SQL injection prevention with prepared statements

## 🚀 Deployment

### Backend Deployment (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy

## 📝 Future Enhancements

See [SPECIFICATION.md](./SPECIFICATION.md) for detailed roadmap including:
- Meal planning and favorites
- Recipe builder
- Barcode scanner
- Social features
- Mobile app
- Analytics and reports

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational purposes. Slimming World is a registered trademark.

## 💡 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React, Node.js, and TypeScript
