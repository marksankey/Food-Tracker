import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Validate DATABASE_URL before attempting connection
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL environment variable is not set');
  console.error('');
  console.error('Please set the DATABASE_URL environment variable with your PostgreSQL connection string.');
  console.error('');
  console.error('Expected format:');
  console.error('  postgresql://username:password@host:5432/database');
  console.error('');
  console.error('For deployment on Render with Supabase:');
  console.error('  1. Get your connection string from Supabase project settings');
  console.error('  2. Add DATABASE_URL to your Render environment variables');
  console.error('  3. Redeploy your application');
  console.error('');
  process.exit(1);
}

// Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.error('❌ FATAL ERROR: DATABASE_URL must start with postgres:// or postgresql://');
  console.error(`Received: ${databaseUrl.substring(0, 20)}...`);
  console.error('');
  console.error('Expected format:');
  console.error('  postgresql://username:password@host:5432/database');
  console.error('');
  process.exit(1);
}

// Parse URL for validation
let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch (error) {
  console.error('❌ FATAL ERROR: DATABASE_URL is not a valid URL');
  console.error(`Error: ${error instanceof Error ? error.message : 'Invalid URL format'}`);
  console.error('');
  console.error('Expected format:');
  console.error('  postgresql://username:password@host:5432/database');
  console.error('');
  process.exit(1);
}

// Check for placeholder values
const hostname = parsedUrl.hostname.toLowerCase();
if (hostname.includes('xxx') || hostname.includes('your-') || hostname === 'host' || hostname === 'localhost') {
  console.error('❌ FATAL ERROR: DATABASE_URL contains placeholder values');
  console.error(`   Hostname: ${parsedUrl.hostname}`);
  console.error('');
  console.error('You need to replace the placeholder with your actual Supabase database hostname.');
  console.error('');
  console.error('Steps to fix:');
  console.error('  1. Go to your Supabase project: https://supabase.com/dashboard/project/_/settings/database');
  console.error('  2. Look for "Connection string" under "Connection pooling"');
  console.error('  3. Copy the FULL connection string (starts with postgresql://postgres:...)');
  console.error('  4. Replace [YOUR-PASSWORD] with your actual database password');
  console.error('  5. Set it as DATABASE_URL in Render environment variables');
  console.error('');
  console.error('The hostname should look like: db.abcdefghijklm.supabase.co');
  console.error('');
  process.exit(1);
}

// Check for password placeholder
if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('YOUR_PASSWORD')) {
  console.error('❌ FATAL ERROR: DATABASE_URL contains password placeholder');
  console.error('');
  console.error('You need to replace [YOUR-PASSWORD] with your actual Supabase database password.');
  console.error('');
  console.error('Steps to fix:');
  console.error('  1. Go to your Supabase project settings: Settings → Database');
  console.error('  2. Find your database password (you set this when creating the project)');
  console.error('  3. Replace [YOUR-PASSWORD] in the connection string with the actual password');
  console.error('  4. Update DATABASE_URL in Render environment variables');
  console.error('');
  process.exit(1);
}

// Warn if using localhost in production
if (process.env.NODE_ENV === 'production' && (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1'))) {
  console.error('⚠️  WARNING: DATABASE_URL contains localhost in production environment');
  console.error('   This will likely fail in deployment. Use a hosted database like Supabase.');
  console.error('');
}

console.log('✅ Database URL configured');
console.log(`   Host: ${parsedUrl.hostname}`);
console.log(`   Port: ${parsedUrl.port || '5432'}`);
console.log(`   Database: ${parsedUrl.pathname.substring(1)}`);

// Database connection pool
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to retry connection with exponential backoff
const connectWithRetry = async (maxRetries = 5, initialDelay = 2000): Promise<pg.PoolClient> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      const client = await pool.connect();
      console.log('✅ Successfully connected to database');
      return client;
    } catch (error: any) {
      lastError = error;

      // Provide specific error guidance
      if (error.code === 'ENOTFOUND') {
        console.error(`❌ DNS lookup failed for hostname: ${error.hostname}`);
        console.error('');
        console.error('This usually means:');
        console.error('  1. The database hostname in DATABASE_URL is incorrect');
        console.error('  2. Your Supabase project might be paused or deleted');
        console.error('  3. There is a network connectivity issue');
        console.error('');
        console.error('Please verify:');
        console.error('  - Your Supabase project is active at https://supabase.com/dashboard');
        console.error('  - The DATABASE_URL hostname matches your Supabase project');
        console.error('  - The format is: postgresql://postgres:PASSWORD@db.PROJECTID.supabase.co:5432/postgres');
        console.error('');
      } else if (error.code === 'ECONNREFUSED') {
        console.error(`❌ Connection refused: ${error.address}:${error.port}`);
        console.error('');
        console.error('The database server is not accepting connections.');
        console.error('');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Connection timeout');
        console.error('');
        console.error('The database server is not responding.');
        console.error('');
      } else if (error.message?.includes('password authentication failed')) {
        console.error('❌ Authentication failed');
        console.error('');
        console.error('The database password in DATABASE_URL is incorrect.');
        console.error('');
      }

      // Don't retry for authentication errors or DNS errors
      if (error.code === 'ENOTFOUND' || error.message?.includes('password authentication failed')) {
        console.error('❌ Connection failed - not retrying for this error type');
        throw error;
      }

      // Retry with exponential backoff for other errors
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ Failed to connect after ${maxRetries} attempts`);
  throw lastError;
};

export const initializeDatabase = async () => {
  const client = await connectWithRetry();

  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        starting_weight REAL NOT NULL DEFAULT 0,
        current_weight REAL NOT NULL DEFAULT 0,
        target_weight REAL NOT NULL DEFAULT 0,
        height REAL,
        daily_syn_allowance INTEGER NOT NULL DEFAULT 15,
        healthy_extra_a_allowance INTEGER NOT NULL DEFAULT 1,
        healthy_extra_b_allowance INTEGER NOT NULL DEFAULT 1,
        healthy_extra_c_allowance INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add healthy_extra_c_allowance column if it doesn't exist (migration for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'user_profiles' AND column_name = 'healthy_extra_c_allowance') THEN
          ALTER TABLE user_profiles ADD COLUMN healthy_extra_c_allowance INTEGER NOT NULL DEFAULT 1;
        END IF;
      END $$;
    `);

    // Foods table
    await client.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        syn_value REAL NOT NULL DEFAULT 0,
        is_free_food INTEGER NOT NULL DEFAULT 0,
        is_speed_food INTEGER NOT NULL DEFAULT 0,
        healthy_extra_type TEXT,
        portion_size REAL NOT NULL DEFAULT 100,
        portion_unit TEXT NOT NULL DEFAULT 'g',
        category TEXT NOT NULL DEFAULT 'general',
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Food Diary Entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_diary (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        food_id TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        syn_value_consumed REAL NOT NULL DEFAULT 0,
        is_healthy_extra INTEGER NOT NULL DEFAULT 0,
        healthy_extra_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
      )
    `);

    // Add healthy_extra_type column if it doesn't exist (migration for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'food_diary' AND column_name = 'healthy_extra_type') THEN
          ALTER TABLE food_diary ADD COLUMN healthy_extra_type TEXT;
        END IF;
      END $$;
    `);

    // Weight Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        weight REAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_food_diary_user_date ON food_diary(user_id, date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name)
    `);

    console.log('✅ Database schema initialized successfully');

    // Auto-seed if database is empty
    const foodCountResult = await client.query('SELECT COUNT(*) as count FROM foods');
    const foodCount = parseInt(foodCountResult.rows[0].count);

    if (foodCount === 0) {
      console.log('Database is empty, seeding with initial foods...');
      await seedDatabase(client);
    }

    // Create default user for personal app (no authentication)
    const defaultUserId = 'default-user';
    const existingUserResult = await client.query('SELECT * FROM users WHERE id = $1', [defaultUserId]);

    if (existingUserResult.rows.length === 0) {
      console.log('Creating default user for personal app...');
      await client.query(
        'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
        [defaultUserId, 'default@local', 'not-needed', 'My Food Tracker']
      );
      await client.query(
        'INSERT INTO user_profiles (id, user_id, starting_weight, current_weight, target_weight, daily_syn_allowance, healthy_extra_a_allowance, healthy_extra_b_allowance, healthy_extra_c_allowance) VALUES ($1, $2, 0, 0, 0, 15, 1, 1, 1)',
        [uuidv4(), defaultUserId]
      );
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

const seedDatabase = async (client: pg.PoolClient) => {
  const foods = [
    // Free Foods - Meat and Poultry (cooked without oil, lean cuts, skin removed)
    { name: 'Chicken Breast (skinless)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Turkey Breast', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Lean Beef Mince (5% fat)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Pork Tenderloin (lean)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Lean Ham', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Gammon (fat removed)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Lean Lamb', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Venison', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },

    // Free Foods - Eggs (cooked without butter, oil or fat)
    { name: 'Eggs', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 1, portionUnit: 'egg' },
    { name: 'Boiled Eggs', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 1, portionUnit: 'egg' },
    { name: 'Poached Eggs', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 1, portionUnit: 'egg' },
    { name: 'Scrambled Eggs (no fat)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 1, portionUnit: 'egg' },

    // Free Foods - Fish (fresh and frozen, cooked without fat)
    { name: 'White Fish (cod, haddock)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Salmon', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Tuna (in brine)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Tuna Steak (fresh)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Prawns', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Sea Bass', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Trout', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Mackerel (fresh)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Plaice', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Smoked Salmon', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Smoked Haddock', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Crab', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Mussels', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Squid', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },

    // Free Foods - Plant-based Proteins
    { name: 'Tofu (plain)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Smoked Tofu', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Quorn Mince', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Quorn Pieces', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Seitan (plain)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Textured Soya Protein (TVP)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },

    // Free Foods - Fat-free Dairy
    { name: 'Fat-free Natural Yogurt', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Skyr', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Plain Quark', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Fat-free Fromage Frais', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Plain Soya Yogurt (with calcium)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },

    // Free Foods - Pasta, Rice and Grains (cooked without fat or oil)
    { name: 'Pasta (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Rice (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Noodles (egg noodles)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Rice Noodles', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Couscous (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 60, portionUnit: 'g' },
    { name: 'Bulgur Wheat', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 60, portionUnit: 'g' },
    { name: 'Quinoa', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 60, portionUnit: 'g' },

    // Free Foods - Potatoes (cooked without fat)
    { name: 'Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'Sweet Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'Baked Potato', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 200, portionUnit: 'g' },
    { name: 'Boiled Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'Mashed Potato (no fat)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'New Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },

    // Free Foods - Beans, Peas and Lentils
    { name: 'Beans (kidney, black, etc)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Lentils', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Baked Beans', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Mushy Peas', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Chickpeas', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Butter Beans', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Cannellini Beans', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Garden Peas', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 80, portionUnit: 'g' },

    // Speed Foods - Vegetables
    { name: 'Broccoli', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Carrots', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Cauliflower', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Spinach', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Tomatoes', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Peppers', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Courgette (zucchini)', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Mushrooms', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Green Beans', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Cabbage', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Lettuce', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },
    { name: 'Cucumber', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'vegetables', portionSize: 80, portionUnit: 'g' },

    // Speed Foods - Fruits
    { name: 'Apple', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 1, portionUnit: 'medium' },
    { name: 'Banana', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 1, portionUnit: 'medium' },
    { name: 'Orange', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 1, portionUnit: 'medium' },
    { name: 'Strawberries', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 100, portionUnit: 'g' },
    { name: 'Grapes', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 100, portionUnit: 'g' },
    { name: 'Blueberries', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 100, portionUnit: 'g' },
    { name: 'Raspberries', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 100, portionUnit: 'g' },
    { name: 'Melon', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 150, portionUnit: 'g' },
    { name: 'Pineapple', synValue: 0, isFreeFood: true, isSpeedFood: true, category: 'fruit', portionSize: 100, portionUnit: 'g' },

    // Healthy Extra A (Dairy)
    { name: 'Semi-skimmed Milk', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'A', category: 'dairy', portionSize: 250, portionUnit: 'ml' },
    { name: 'Skimmed Milk', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'A', category: 'dairy', portionSize: 350, portionUnit: 'ml' },
    { name: 'Cheddar Cheese (reduced fat)', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'A', category: 'dairy', portionSize: 30, portionUnit: 'g' },
    { name: 'Cottage Cheese', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'A', category: 'dairy', portionSize: 120, portionUnit: 'g' },

    // Healthy Extra B (Fibre)
    { name: 'Wholemeal Bread', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'bread', portionSize: 2, portionUnit: 'slices' },
    { name: 'Weetabix', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 2, portionUnit: 'biscuits' },
    { name: 'Porridge Oats', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 35, portionUnit: 'g' },
    { name: 'All-Bran', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 40, portionUnit: 'g' },
    { name: 'Shredded Wheat', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 2, portionUnit: 'biscuits' },
    { name: 'Ryvita Crispbread', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'bread', portionSize: 4, portionUnit: 'slices' },
    { name: 'Canned Fruit in Juice', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'fruit', portionSize: 200, portionUnit: 'g' },
    { name: 'Dried Apricots', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'fruit', portionSize: 30, portionUnit: 'g' },
    { name: 'Alpen Light Cereal Bar', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'snacks', portionSize: 2, portionUnit: 'bars' },

    // Healthy Extra C (Healthy Fats)
    { name: 'Almonds', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Cashew Nuts', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Walnuts', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Brazil Nuts', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 20, portionUnit: 'g' },
    { name: 'Peanuts (unsalted)', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Mixed Nuts (unsalted)', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Sunflower Seeds', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Pumpkin Seeds', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Chia Seeds', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Flaxseeds', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'nuts', portionSize: 25, portionUnit: 'g' },
    { name: 'Avocado', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'fruit', portionSize: 60, portionUnit: 'g' },
    { name: 'Olives', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'vegetables', portionSize: 28, portionUnit: 'g' },
    { name: 'Extra Virgin Olive Oil', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'oils', portionSize: 1, portionUnit: 'tbsp' },
    { name: 'Rapeseed Oil', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'oils', portionSize: 1, portionUnit: 'tbsp' },
    { name: 'Flaxseed Oil', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'C', category: 'oils', portionSize: 1, portionUnit: 'tbsp' },

    // Syn Foods - Common Items
    { name: 'Chocolate Bar', synValue: 12, isFreeFood: false, isSpeedFood: false, category: 'snacks', portionSize: 50, portionUnit: 'g' },
    { name: 'Crisps (regular)', synValue: 8.5, isFreeFood: false, isSpeedFood: false, category: 'snacks', portionSize: 30, portionUnit: 'g' },
    { name: 'Biscuit (digestive)', synValue: 4, isFreeFood: false, isSpeedFood: false, category: 'snacks', portionSize: 1, portionUnit: 'biscuit' },
    { name: 'White Bread', synValue: 5, isFreeFood: false, isSpeedFood: false, category: 'bread', portionSize: 2, portionUnit: 'slices' },
    { name: 'Butter', synValue: 6, isFreeFood: false, isSpeedFood: false, category: 'spreads', portionSize: 10, portionUnit: 'g' },
    { name: 'Olive Oil', synValue: 6, isFreeFood: false, isSpeedFood: false, category: 'oils', portionSize: 1, portionUnit: 'tbsp' },
    { name: 'Mayonnaise', synValue: 6, isFreeFood: false, isSpeedFood: false, category: 'condiments', portionSize: 1, portionUnit: 'tbsp' },
    { name: 'Sugar', synValue: 1, isFreeFood: false, isSpeedFood: false, category: 'sweeteners', portionSize: 1, portionUnit: 'tsp' },
    { name: 'Wine (red/white)', synValue: 5, isFreeFood: false, isSpeedFood: false, category: 'alcohol', portionSize: 125, portionUnit: 'ml' },
    { name: 'Beer (regular)', synValue: 5, isFreeFood: false, isSpeedFood: false, category: 'alcohol', portionSize: 330, portionUnit: 'ml' },
    { name: 'Pizza (cheese & tomato)', synValue: 18, isFreeFood: false, isSpeedFood: false, category: 'meals', portionSize: 1, portionUnit: 'slice' },
    { name: 'Burger (beef)', synValue: 15, isFreeFood: false, isSpeedFood: false, category: 'meals', portionSize: 1, portionUnit: 'burger' },
    { name: 'Ice Cream', synValue: 4, isFreeFood: false, isSpeedFood: false, category: 'desserts', portionSize: 1, portionUnit: 'scoop' },
    { name: 'Cake (sponge)', synValue: 10, isFreeFood: false, isSpeedFood: false, category: 'desserts', portionSize: 1, portionUnit: 'slice' },

    // Fruit Juice and Smoothies (NOT free - count as Syns per Slimming World rules)
    { name: 'Orange Juice', synValue: 2.5, isFreeFood: false, isSpeedFood: false, category: 'drinks', portionSize: 150, portionUnit: 'ml' },
    { name: 'Apple Juice', synValue: 2.5, isFreeFood: false, isSpeedFood: false, category: 'drinks', portionSize: 150, portionUnit: 'ml' },
    { name: 'Fruit Smoothie', synValue: 4, isFreeFood: false, isSpeedFood: false, category: 'drinks', portionSize: 200, portionUnit: 'ml' },
    { name: 'Fruit Puree', synValue: 2, isFreeFood: false, isSpeedFood: false, category: 'snacks', portionSize: 100, portionUnit: 'g' },

    // Low Syn Options (note: plain fat-free yogurt is FREE - see Fat-free Dairy section above)
    { name: 'Fat Free Flavoured Yogurt', synValue: 0.5, isFreeFood: false, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Low Calorie Cooking Spray', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'oils', portionSize: 5, portionUnit: 'sprays' },
    { name: 'Diet Coke', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'drinks', portionSize: 330, portionUnit: 'ml' },
  ];

  for (const food of foods) {
    await client.query(
      `INSERT INTO foods (id, name, syn_value, is_free_food, is_speed_food, healthy_extra_type, portion_size, portion_unit, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(),
        food.name,
        food.synValue,
        food.isFreeFood ? 1 : 0,
        food.isSpeedFood ? 1 : 0,
        (food as any).healthyExtraType || null,
        food.portionSize,
        food.portionUnit,
        food.category
      ]
    );
  }

  console.log(`✅ Seeded ${foods.length} foods to the database`);
};

export default pool;
