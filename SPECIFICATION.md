# Food Tracker Application - Specification Document

## Overview
A web-based food tracking application inspired by Slimming World principles, allowing users to track their daily food intake, monitor syn values, and manage their weight loss journey.

## Core Concepts (Slimming World Principles)

### 1. Syn Values
- Most foods have a syn value (points system)
- Daily syn allowance: 5-15 syns per day
- Higher syn values indicate less diet-friendly foods
- Users track syns consumed throughout the day

### 2. Free Foods
- Foods with 0 syns that can be eaten freely
- Categories:
  - Lean proteins (chicken, fish, eggs, tofu)
  - Most fruits and vegetables
  - Pasta, rice, potatoes (in moderation)
  - Fat-free dairy products

### 3. Speed Foods
- Fruits and vegetables that are filling and low in calories
- Should make up 1/3 of each meal
- Marked with a special indicator in the app

### 4. Healthy Extras
- **Healthy Extra A**: Dairy/calcium sources (milk, cheese)
- **Healthy Extra B**: Fiber sources (bread, cereals)
- Users get 1-2 of each per day depending on their plan

## Application Features

### Phase 1: Core Features (MVP)

#### 1.1 User Management
- User registration and login
- User profile with:
  - Name
  - Email
  - Starting weight
  - Current weight
  - Target weight
  - Daily syn allowance (customizable, default 15)

#### 1.2 Food Database
- Comprehensive database of common foods with:
  - Food name
  - Syn value
  - Category (Free Food, Speed Food, Regular)
  - Healthy Extra type (if applicable)
  - Portion size information
  - Search functionality by name
  - Filter by category
  - Sort by syn value

#### 1.3 Daily Food Diary
- Log meals by day:
  - Breakfast
  - Lunch
  - Dinner
  - Snacks
- Add foods from database to meals
- Custom portion sizes with automatic syn calculation
- Running total of daily syns
- Visual indicator showing syns used vs. allowance
- Mark Healthy Extra A & B usage
- Speed food counter for each meal

#### 1.4 Dashboard
- Current day summary:
  - Total syns consumed
  - Remaining syns
  - Healthy Extras used
  - Speed foods consumed
- Weekly overview:
  - Average daily syns
  - Days on target
  - Weight progress chart

### Phase 2: Enhanced Features

#### 2.1 Custom Foods
- Users can add their own foods to the database
- Calculate syns based on nutritional information
- Save frequently used custom foods

#### 2.2 Meal Planning
- Plan meals in advance
- Copy previous day's meals
- Favorite meals for quick logging
- Recipe builder with total syn calculation

#### 2.3 Weight Tracking
- Weekly weigh-in log
- Weight history graph
- BMI calculation and tracking
- Progress statistics (total loss, average weekly loss)

#### 2.4 Reports & Analytics
- Weekly/monthly syn consumption reports
- Food frequency analysis
- Most consumed foods
- Success patterns (correlating low syn days with weight loss)

### Phase 3: Advanced Features

#### 3.1 Social Features
- Share recipes with other users
- Support groups/communities
- Achievement badges
- Progress sharing

#### 3.2 Barcode Scanner
- Scan product barcodes
- Automatic food recognition
- Add to food diary

#### 3.3 Mobile App
- iOS and Android native apps
- Offline mode with sync
- Camera integration for barcode scanning
- Push notifications for daily reminders

## Technical Architecture

### Technology Stack (Recommendation)

#### Frontend
- **Framework**: React.js with TypeScript
- **UI Library**: Material-UI or Tailwind CSS
- **State Management**: Redux or Context API
- **Routing**: React Router
- **Forms**: React Hook Form
- **Charts**: Chart.js or Recharts

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT tokens
- **API**: RESTful API

#### Database
- **Primary**: PostgreSQL
  - User data
  - Food database
  - Daily logs
- **Cache**: Redis (optional for performance)

#### Deployment
- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or AWS
- **Database**: Railway, Supabase, or AWS RDS

### Project Structure
```
food-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── FoodDatabase/
│   │   │   ├── FoodDiary/
│   │   │   ├── WeightTracker/
│   │   │   └── common/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   └── package.json
├── database/
│   ├── migrations/
│   └── seeds/
└── docs/
```

## Database Schema (Initial Design)

### Users
```sql
- id (UUID, primary key)
- email (unique)
- password_hash
- name
- created_at
- updated_at
```

### UserProfiles
```sql
- id (UUID, primary key)
- user_id (foreign key)
- starting_weight
- current_weight
- target_weight
- height
- daily_syn_allowance
- healthy_extra_a_allowance
- healthy_extra_b_allowance
```

### Foods
```sql
- id (UUID, primary key)
- name
- syn_value (per 100g or standard serving)
- is_free_food
- is_speed_food
- healthy_extra_type (A, B, or null)
- portion_size
- portion_unit
- category
- created_by (null for default foods, user_id for custom)
```

### FoodDiary
```sql
- id (UUID, primary key)
- user_id (foreign key)
- date
- meal_type (breakfast, lunch, dinner, snacks)
- food_id (foreign key)
- quantity
- syn_value_consumed
- is_healthy_extra
```

### WeightLog
```sql
- id (UUID, primary key)
- user_id (foreign key)
- date
- weight
- notes
```

## User Interface Mockup Concepts

### 1. Dashboard
- Top: Date selector and daily syn progress bar
- Middle: Quick add food section
- Bottom: Today's meals list with totals

### 2. Food Database Page
- Search bar at top
- Filter chips (All, Free Foods, Speed Foods, Low Syn)
- Grid/list view of foods with syn values
- Click to add to diary

### 3. Daily Diary Page
- Date navigation
- Four sections for meal types
- Each section shows foods added with syn values
- Bottom summary: Total syns, Healthy Extras status

### 4. Weight Tracker Page
- Add weigh-in form
- Line chart showing weight over time
- Statistics cards (total lost, BMI, etc.)

## Development Phases & Timeline

### Phase 1: Foundation (Weeks 1-3)
- [ ] Project setup and repository structure
- [ ] Database design and setup
- [ ] Basic authentication system
- [ ] Initial food database (50-100 common foods)
- [ ] Basic UI framework and routing

### Phase 2: Core Features (Weeks 4-6)
- [ ] Food database with search
- [ ] Daily food diary functionality
- [ ] Syn calculation and tracking
- [ ] Dashboard with daily summary

### Phase 3: Enhanced Features (Weeks 7-9)
- [ ] Weight tracking
- [ ] Healthy Extras tracking
- [ ] Speed food indicators
- [ ] Weekly reports
- [ ] Custom food addition

### Phase 4: Polish & Deploy (Weeks 10-12)
- [ ] UI/UX improvements
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Deployment
- [ ] User documentation

## Security Considerations

1. **Authentication**
   - Secure password hashing (bcrypt)
   - JWT token expiration
   - Refresh token mechanism

2. **Data Protection**
   - HTTPS only
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CORS configuration

3. **Privacy**
   - User data encryption
   - GDPR compliance
   - Data export functionality
   - Account deletion option

## Success Metrics

1. **User Engagement**
   - Daily active users
   - Average foods logged per day
   - User retention rate

2. **Feature Usage**
   - Most searched foods
   - Most logged foods
   - Healthy Extras usage rate

3. **Health Outcomes**
   - Average weight loss
   - Days staying within syn allowance
   - Speed food consumption

## Open Questions for Review

1. **Platform Priority**: Should we build web-first or mobile-first?
2. **Food Database**: Should we integrate with an external nutrition API (like Nutritionix or FatSecret) or build our own?
3. **Syn Calculation**: Should users be able to calculate syns from nutritional info, or only use pre-defined values?
4. **Monetization**: Free with optional premium features, or completely free?
5. **Multi-user**: Support for families or groups sharing progress?

## Next Steps

1. Review and approve this specification
2. Set up development environment
3. Initialize frontend and backend projects
4. Create initial database schema
5. Seed food database with starter data
6. Begin Phase 1 development

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Status**: Awaiting Review
