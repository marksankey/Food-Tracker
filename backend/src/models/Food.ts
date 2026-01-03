import { db } from '../config/database.js';
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
  static create(data: Omit<Food, 'id' | 'created_at'>, userId?: string): Food {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO foods (id, name, syn_value, is_free_food, is_speed_food, healthy_extra_type, portion_size, portion_unit, category, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
    );

    return this.findById(id)!;
  }

  static findById(id: string): Food | undefined {
    const stmt = db.prepare('SELECT * FROM foods WHERE id = ?');
    return stmt.get(id) as Food | undefined;
  }

  static findAll(limit: number = 100, offset: number = 0): Food[] {
    const stmt = db.prepare('SELECT * FROM foods ORDER BY name LIMIT ? OFFSET ?');
    return stmt.all(limit, offset) as Food[];
  }

  static search(query: string, filters?: { category?: string; is_free_food?: boolean; is_speed_food?: boolean }): Food[] {
    let sql = 'SELECT * FROM foods WHERE name LIKE ?';
    const params: any[] = [`%${query}%`];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.is_free_food !== undefined) {
      sql += ' AND is_free_food = ?';
      params.push(filters.is_free_food ? 1 : 0);
    }

    if (filters?.is_speed_food !== undefined) {
      sql += ' AND is_speed_food = ?';
      params.push(filters.is_speed_food ? 1 : 0);
    }

    sql += ' ORDER BY name LIMIT 50';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Food[];
  }
}
