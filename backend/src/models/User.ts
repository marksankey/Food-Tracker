import { pool } from '../config/database.js';
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
  healthy_extra_c_allowance: number;
}

export class UserModel {
  static async create(email: string, password: string, name: string): Promise<User> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)`,
      [id, email, password_hash, name]
    );

    // Create default profile
    const profileId = uuidv4();
    await pool.query(
      `INSERT INTO user_profiles (id, user_id, starting_weight, current_weight, target_weight, daily_syn_allowance, healthy_extra_a_allowance, healthy_extra_b_allowance, healthy_extra_c_allowance)
       VALUES ($1, $2, 0, 0, 0, 15, 1, 1, 1)`,
      [profileId, id]
    );

    const user = await this.findById(id);
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  static async findById(id: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] as User | undefined;
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] as User | undefined;
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async getProfile(userId: string): Promise<any | undefined> {
    const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const profile = result.rows[0] as UserProfile | undefined;

    if (!profile) return undefined;

    // Transform to camelCase for frontend
    return {
      id: profile.id,
      userId: profile.user_id,
      startingWeight: profile.starting_weight,
      currentWeight: profile.current_weight,
      targetWeight: profile.target_weight,
      height: profile.height,
      dailySynAllowance: profile.daily_syn_allowance,
      healthyExtraAAllowance: profile.healthy_extra_a_allowance,
      healthyExtraBAllowance: profile.healthy_extra_b_allowance,
      healthyExtraCAllowance: profile.healthy_extra_c_allowance || 1
    };
  }

  static async updateProfile(userId: string, data: any): Promise<any> {
    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      startingWeight: 'starting_weight',
      currentWeight: 'current_weight',
      targetWeight: 'target_weight',
      height: 'height',
      dailySynAllowance: 'daily_syn_allowance',
      healthyExtraAAllowance: 'healthy_extra_a_allowance',
      healthyExtraBAllowance: 'healthy_extra_b_allowance',
      healthyExtraCAllowance: 'healthy_extra_c_allowance'
    };

    const fields = Object.keys(data)
      .filter(key => fieldMap[key])
      .map((key, index) => `${fieldMap[key]} = $${index + 1}`)
      .join(', ');

    const values = Object.keys(data)
      .filter(key => fieldMap[key])
      .map(key => data[key]);

    await pool.query(
      `UPDATE user_profiles SET ${fields} WHERE user_id = $${values.length + 1}`,
      [...values, userId]
    );

    return await this.getProfile(userId);
  }
}
