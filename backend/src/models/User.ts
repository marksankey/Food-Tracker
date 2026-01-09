import { db } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  starting_weight: number;
  current_weight: number;
  target_weight: number;
  height?: number;
  daily_syn_allowance: number;
  healthy_extra_a_allowance: number;
  healthy_extra_b_allowance: number;
}

export class UserModel {
  static async create(email: string, password: string, name: string): Promise<User> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, email, password_hash, name);

    // Create default profile
    const profileId = uuidv4();
    const profileStmt = db.prepare(`
      INSERT INTO user_profiles (id, user_id, starting_weight, current_weight, target_weight, daily_syn_allowance, healthy_extra_a_allowance, healthy_extra_b_allowance)
      VALUES (?, ?, 0, 0, 0, 15, 1, 1)
    `);
    profileStmt.run(profileId, id);

    return this.findById(id)!;
  }

  static findById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static getProfile(userId: string): UserProfile | undefined {
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?');
    return stmt.get(userId) as UserProfile | undefined;
  }

  static updateProfile(userId: string, data: any): UserProfile {
    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      startingWeight: 'starting_weight',
      currentWeight: 'current_weight',
      targetWeight: 'target_weight',
      height: 'height',
      dailySynAllowance: 'daily_syn_allowance',
      healthyExtraAAllowance: 'healthy_extra_a_allowance',
      healthyExtraBAllowance: 'healthy_extra_b_allowance'
    };

    const fields = Object.keys(data)
      .filter(key => fieldMap[key])
      .map(key => `${fieldMap[key]} = ?`)
      .join(', ');

    const values = Object.keys(data)
      .filter(key => fieldMap[key])
      .map(key => data[key]);

    const stmt = db.prepare(`
      UPDATE user_profiles SET ${fields} WHERE user_id = ?
    `);

    stmt.run(...values, userId);
    return this.getProfile(userId)!;
  }
}
