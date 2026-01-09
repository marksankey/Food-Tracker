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
};

export default db;
