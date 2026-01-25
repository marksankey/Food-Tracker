# Food Tracker - Claude Context

## Project Overview

This is a comprehensive food tracking application based on Slimming World principles. Users can track daily syn intake, log meals, monitor weight progress, and manage their diet effectively.

### Key Principles
- **Syn Tracking**: Default 15 syns/day (customizable)
- **Free Foods**: Foods with 0 syns
- **Speed Foods**: Fruits and vegetables (aim for 1/3 of each meal)
- **Healthy Extras**: Track A (dairy) and B (fiber) allowances

## Technical Stack

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules
- **Charts**: Chart.js for weight visualization
- **Port**: 3000 (development)

### Backend (`/backend`)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (pg library)
- **Database Hosting**: Supabase (production)
- **Authentication**: No authentication (personal app)
- **Password Security**: bcrypt (for legacy auth routes)
- **Port**: 5000 (development)

## Project Structure

```
Food-Tracker/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, FoodDiary, etc.)
│   │   ├── services/      # API client (authService, foodService, etc.)
│   │   ├── store/         # Context API state management
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Helper functions
│   ├── .env              # Frontend environment variables
│   └── package.json
│
├── backend/              # Express API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database models (PostgreSQL queries)
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # Auth middleware (noauth.js for personal use)
│   │   ├── config/       # Database configuration (PostgreSQL pool)
│   │   └── utils/        # Utilities
│   ├── .env             # Backend environment variables
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── keep-alive.yml  # Prevents Render app spindown
│
├── README.md            # User documentation
├── SPECIFICATION.md     # Detailed requirements
└── claude.md           # This file
```

## Database Schema

### Core Tables
1. **users**: User accounts (id, username, email, password_hash)
2. **user_profiles**: Health data (syn_allowance, starting_weight, target_weight, height)
3. **foods**: Food database (name, category, syns, portion_size, is_free_food, is_speed_food, healthy_extra_type)
4. **food_diary**: Meal entries (user_id, food_id, meal_type, date, quantity)
5. **weight_logs**: Weight tracking (user_id, weight, date, notes)

### Key Relationships
- Users → UserProfiles (1:1)
- Users → FoodDiary (1:many)
- Users → WeightLogs (1:many)
- Foods → FoodDiary (1:many)

## API Endpoints

### Authentication (`/api/auth`)
**Note**: Authentication is simplified for personal use. All routes are accessible without JWT tokens.
- `POST /register` - Create account (legacy, returns stub token)
- `POST /login` - Authenticate (legacy, returns stub token)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile

### Foods (`/api/foods`)
- `GET /` - Get all foods
- `GET /search?q=query` - Search foods by name
- `GET /:id` - Get specific food
- `POST /` - Create custom food

### Food Diary (`/api/diary`)
- `GET /?date=YYYY-MM-DD` - Get entries for date
- `GET /summary?date=YYYY-MM-DD` - Get daily totals
- `POST /` - Add entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry

### Weight Logs (`/api/weight`)
- `GET /` - Get all weight logs
- `POST /` - Add weight entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry

## Development Workflow

### Initial Setup
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npm run seed          # Initialize DB with 60+ foods

# Frontend setup
cd frontend
npm install
cp .env.example .env
```

### Running Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev           # Runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev           # Runs on http://localhost:3000
```

### Common Commands
```bash
# Backend
npm run dev           # Development with hot reload
npm run build         # Compile TypeScript
npm start            # Production server
npm run seed         # Reset and seed database

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Test production build
```

## Key Features & Components

### Authentication Flow
**SIMPLIFIED FOR PERSONAL USE** - Authentication has been removed to make this a personal app.
1. App opens directly to dashboard (no login required)
2. Uses stub authentication middleware (`noauth.js`)
3. Legacy auth routes still exist but return stub tokens
4. No JWT verification on protected routes
5. AuthContext still manages state but doesn't enforce authentication
6. Frontend skips login/register screens

### Food Database
- Pre-loaded with 60+ common foods
- Categories: Free Foods, Speed Foods, Protein, Carbs, Dairy, Snacks
- Searchable by name
- Users can add custom foods
- Includes syn values, portion sizes, and special flags

### Food Diary
- Organized by meal type (breakfast, lunch, dinner, snacks)
- Date-based filtering with responsive date navigator
- Real-time syn calculation
- Dynamic food search with instant filtering as you type
- Quick add from food database with direct "Add to Food Diary" from search results
- Search term retained when switching between tabs
- Edit/delete existing entries

### Dashboard
- Daily syn counter with visual progress
- Today's meals overview
- Quick navigation
- Healthy extras tracking

### Weight Tracker
- Log weight entries with dates
- Line chart visualization
- Progress calculation with Last Change and Total Loss metrics
- Automatic sync with user profile (currentWeight updates from latest entry)
- BMI calculation (if height provided)
- Support for stones and pounds (imperial) format

## Important Notes

### Recent Changes
**2026-01-25**: Mobile layout and food search improvements
- Fixed mobile tab layout with reduced padding/font-size for better visibility
- Added responsive styles for date navigator with proper button sizing
- Added dynamic food search with real-time filtering in Food Diary
- Added direct 'Add to Food Diary' button from product search results
- Related PRs: #55, #56, #57

**2026-01-24**: Weight tracker profile synchronization
- Fixed weight tracker to sync with user profile using direct API calls
- Profile currentWeight now syncs automatically with most recent weight entry
- Uses profile startingWeight for Last Change and Total Loss calculations
- Fixed infinite loop and loading issues in profile sync
- Related PRs: #50, #51, #52, #53, #54

**2026-01-23**: Search term retention and database connection improvements
- Retain search term when switching food search tabs
- Pass search term from Food Diary to Food Database with UK Products tab default
- Added comprehensive DATABASE_URL validation on startup
- Improved error messages with specific guidance for common issues (DNS, auth, timeouts)
- Added connection retry with exponential backoff for transient failures
- Related PRs: #43, #44, #48, #49

**2026-01-22**: Deployment infrastructure improvements
- Updated deployment guide to use Supabase for PostgreSQL hosting
- Fixed async/await issues for PostgreSQL migration
- Related PRs: #42

**2026-01-21**: Major database and feature updates
- **PostgreSQL Migration**: Migrated from SQLite to PostgreSQL for persistent data storage
- **Imperial Weight Support**: Added stones and pounds format for weight tracking
- **Keep-Alive Workflow**: Added GitHub Actions workflow to prevent Render app spindown
- Related PRs: #38, #39, #40, #41

**2026-01-20**: Major improvements to syn calculation accuracy
- Fixed serving size parsing to handle complex formats (e.g., "100g/3 slices")
- Capped serving sizes at 200g to prevent inflated syn values from large portions
- Improved free food detection to exclude prepared dishes (e.g., pasta sauce)
- Added comprehensive logging for debugging syn calculations across all products
- Ensured free foods consistently display 0 syns regardless of quantity
- Related PRs: #21, #22, #23, #24, #25

**2026-01-11**: Fixed TypeScript build error on Render deployment
- Issue: `generateToken` was not imported in `authController.ts`
- Solution: Added `generateToken` to imports from `noauth.js` middleware
- Location: `backend/src/controllers/authController.ts:3`
- This was causing TS2304 compilation errors preventing Render deployment

**Authentication Removal**: App converted to personal use
- Removed JWT authentication enforcement
- Created `noauth.js` middleware with stub functions
- App opens directly to dashboard
- Legacy auth routes remain for backwards compatibility

### Environment Variables
**Backend (.env)**
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/food_tracker
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

**GitHub Actions Secrets**
```
BACKEND_URL=https://your-backend.onrender.com/api/health
FRONTEND_URL=https://your-frontend.vercel.app (optional)
```

### Security Considerations
**Note**: This is a personal app with simplified authentication.
- No JWT authentication required (uses stub middleware)
- Passwords still hashed with bcrypt for legacy routes
- SQL injection prevented with prepared statements
- CORS enabled for frontend origin
- **WARNING**: Do not use in production with multiple users without proper authentication

### Database Management
- PostgreSQL database with automatic schema initialization on startup
- Database auto-seeds with 60+ foods if empty on first run
- Uses connection pooling with retry logic for reliability
- **Production**: Hosted on Supabase (free tier available)
- **Local development**: Requires local PostgreSQL or use Supabase
- Connection string format: `postgresql://user:password@host:5432/database`

### State Management
- Frontend uses React Context API
- AuthContext: User authentication state
- No Redux or external state library needed
- Local state for component-specific data

## Common Development Tasks

### Adding a New API Endpoint
1. Create controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Add authentication middleware if needed
4. Update API service in `frontend/src/services/`
5. Use in components

### Adding a New Food Category
1. Update seed data in `backend/src/utils/seed.ts`
2. Run `npm run seed` in backend
3. Update category filter in frontend components

### Modifying Database Schema
1. Update model in `backend/src/models/`
2. Update seed script
3. Drop and recreate database (seed script does this)
4. Update TypeScript interfaces in frontend

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link if needed
4. Create corresponding API service if needed

## Testing Strategy

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Add food to diary
- [ ] Search food database
- [ ] Track daily syns
- [ ] Log weight entry
- [ ] View weight chart
- [ ] Update profile settings
- [ ] Create custom food

### Test Users
Create test users with different scenarios:
- New user (no data)
- User with meals logged
- User with weight history
- User at/over syn limit

## Future Enhancements (See SPECIFICATION.md)
- Meal planning
- Recipe builder
- Barcode scanner integration
- Social features (friends, groups)
- Mobile app (React Native)
- Advanced analytics
- Export/import data

## Troubleshooting

### Common Issues

**Backend won't start**
- Check if port 5000 is available
- Verify .env file exists
- Run `npm install` to ensure dependencies

**Frontend can't connect to API**
- Verify backend is running
- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend

**Database errors**
- Verify DATABASE_URL is set correctly in backend/.env
- Check PostgreSQL connection string format: `postgresql://user:pass@host:5432/db`
- For Supabase: ensure project is active and password is correct
- Startup logs show detailed error messages with fix suggestions

**Authentication issues**
- Authentication is simplified for personal use (no JWT required)
- Check that `noauth.js` middleware is being used
- Legacy auth routes should return stub tokens
- If upgrading to multi-user, switch to `auth.js` middleware

## Code Style & Conventions

### TypeScript
- Use interfaces for data structures
- Avoid `any` type when possible
- Export types from `/types` directory
- Use async/await for promises

### React Components
- Functional components with hooks
- Use TypeScript for props
- CSS Modules for styling
- Separate business logic into custom hooks

### API Responses
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, message: "Error description" }
```

### Naming Conventions
- Components: PascalCase (e.g., `FoodDiary.tsx`)
- Files: camelCase or kebab-case
- API routes: kebab-case (e.g., `/food-diary`)
- Database: snake_case (e.g., `user_profiles`)

## Git Branch Strategy

- `main` - Production-ready code (not yet configured)
- `claude/*` - Claude development branches (e.g., `claude/debug-render-deployment-7ZnIO`)
- Feature branches should be descriptive
- Always push to the branch specified in the task context
- Branch names must start with 'claude/' and include session ID for push to succeed

### Current Development Branch
- Working branch: `claude/update-claude-B7k4W`
- Purpose: Update documentation to reflect recent changes

## Contact & Resources

- Repository: https://github.com/marksankey/Food-Tracker
- Documentation: See README.md and SPECIFICATION.md
- Slimming World: Official diet program (this is educational implementation)
