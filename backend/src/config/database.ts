import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/food-tracker.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export const initializeDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Profiles table
  db.exec(`
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
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Foods table
  db.exec(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Food Diary Entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS food_diary (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_id TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      syn_value_consumed REAL NOT NULL DEFAULT 0,
      is_healthy_extra INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    )
  `);

  // Weight Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_food_diary_user_date ON food_diary(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
  `);

  console.log('Database initialized successfully');

  // Auto-seed if database is empty
  const foodCount = db.prepare('SELECT COUNT(*) as count FROM foods').get() as { count: number };
  if (foodCount.count === 0) {
    console.log('Database is empty, seeding with initial foods...');
    seedDatabase();
  }
};

// Import seedDatabase function inline to avoid circular dependencies
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = () => {
  const foods = [
    // Free Foods - Proteins
    { name: 'Chicken Breast (skinless)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Turkey Breast', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Eggs', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 1, portionUnit: 'egg' },
    { name: 'White Fish (cod, haddock)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Salmon', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Tuna (in brine)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Prawns', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Tofu', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Lean Beef Mince (5% fat)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },
    { name: 'Pork Tenderloin (lean)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'protein', portionSize: 100, portionUnit: 'g' },

    // Free Foods - Carbs
    { name: 'Pasta (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Rice (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 75, portionUnit: 'g' },
    { name: 'Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'Sweet Potatoes', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 150, portionUnit: 'g' },
    { name: 'Couscous (dried)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 60, portionUnit: 'g' },
    { name: 'Beans (kidney, black, etc)', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },
    { name: 'Lentils', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'carbs', portionSize: 100, portionUnit: 'g' },

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

    // Healthy Extra B (Fiber)
    { name: 'Wholemeal Bread', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'bread', portionSize: 2, portionUnit: 'slices' },
    { name: 'Weetabix', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 2, portionUnit: 'biscuits' },
    { name: 'Porridge Oats', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 35, portionUnit: 'g' },
    { name: 'All-Bran', synValue: 0, isFreeFood: false, isSpeedFood: false, healthyExtraType: 'B', category: 'cereal', portionSize: 40, portionUnit: 'g' },

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

    // Low Syn Options
    { name: 'Fat Free Yogurt', synValue: 0.5, isFreeFood: false, isSpeedFood: false, category: 'dairy', portionSize: 100, portionUnit: 'g' },
    { name: 'Low Calorie Cooking Spray', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'oils', portionSize: 5, portionUnit: 'sprays' },
    { name: 'Diet Coke', synValue: 0, isFreeFood: true, isSpeedFood: false, category: 'drinks', portionSize: 330, portionUnit: 'ml' },
  ];

  const stmt = db.prepare(`
    INSERT INTO foods (id, name, syn_value, is_free_food, is_speed_food, healthy_extra_type, portion_size, portion_unit, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  foods.forEach(food => {
    stmt.run(
      uuidv4(),
      food.name,
      food.synValue,
      food.isFreeFood ? 1 : 0,
      food.isSpeedFood ? 1 : 0,
      (food as any).healthyExtraType || null,
      food.portionSize,
      food.portionUnit,
      food.category
    );
  });

  console.log(`✅ Seeded ${foods.length} foods to the database`);
};

export default db;
