import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface Food {
  id: string;
  name: string;
  syn_value: number;
  is_free_food: number;
  is_speed_food: number;
  healthy_extra_type?: string;
  portion_size: number;
  portion_unit: string;
  category: string;
  created_by?: string;
  created_at: string;
}

export class FoodModel {
  static async create(data: Omit<Food, 'id' | 'created_at'>, userId?: string): Promise<Food> {
    const id = uuidv4();

    await pool.query(
      `INSERT INTO foods (id, name, syn_value, is_free_food, is_speed_food, healthy_extra_type, portion_size, portion_unit, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        data.name,
        data.syn_value,
        data.is_free_food ? 1 : 0,
        data.is_speed_food ? 1 : 0,
        data.healthy_extra_type || null,
        data.portion_size,
        data.portion_unit,
        data.category,
        userId || null
      ]
    );

    const food = await this.findById(id);
    if (!food) throw new Error('Failed to create food');
    return food;
  }

  static async findById(id: string): Promise<Food | undefined> {
    const result = await pool.query('SELECT * FROM foods WHERE id = $1', [id]);
    return result.rows[0] as Food | undefined;
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<Food[]> {
    const result = await pool.query(
      'SELECT * FROM foods ORDER BY name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows as Food[];
  }

  static async search(query: string, filters?: { category?: string; is_free_food?: boolean; is_speed_food?: boolean }): Promise<Food[]> {
    let sql = 'SELECT * FROM foods WHERE name ILIKE $1';
    const params: any[] = [`%${query}%`];
    let paramIndex = 2;

    if (filters?.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.is_free_food !== undefined) {
      sql += ` AND is_free_food = $${paramIndex}`;
      params.push(filters.is_free_food ? 1 : 0);
      paramIndex++;
    }

    if (filters?.is_speed_food !== undefined) {
      sql += ` AND is_speed_food = $${paramIndex}`;
      params.push(filters.is_speed_food ? 1 : 0);
      paramIndex++;
    }

    sql += ' ORDER BY name LIMIT 50';

    const result = await pool.query(sql, params);
    return result.rows as Food[];
  }

  static async findRecent(days: number = 7, limit: number = 100): Promise<Food[]> {
    const result = await pool.query(
      `SELECT * FROM foods
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows as Food[];
  }

  static async delete(id: string, userId?: string): Promise<boolean> {
    // If userId is provided, only delete if the user created it (for user-created foods)
    // Otherwise, prevent deletion of system foods
    let sql = 'DELETE FROM foods WHERE id = $1';
    const params: any[] = [id];

    if (userId) {
      sql += ' AND created_by = $2';
      params.push(userId);
    }

    const result = await pool.query(sql, params);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
