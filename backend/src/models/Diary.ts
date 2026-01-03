import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { Food } from './Food.js';

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  food_id: string;
  quantity: number;
  syn_value_consumed: number;
  is_healthy_extra: number;
  created_at: string;
}

export interface DiaryEntryWithFood extends DiaryEntry {
  food?: Food;
}

export class DiaryModel {
  static create(userId: string, data: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>): DiaryEntry {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO food_diary (id, user_id, date, meal_type, food_id, quantity, syn_value_consumed, is_healthy_extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.date,
      data.meal_type,
      data.food_id,
      data.quantity,
      data.syn_value_consumed,
      data.is_healthy_extra ? 1 : 0
    );

    return this.findById(id)!;
  }

  static findById(id: string): DiaryEntry | undefined {
    const stmt = db.prepare('SELECT * FROM food_diary WHERE id = ?');
    return stmt.get(id) as DiaryEntry | undefined;
  }

  static findByUserAndDate(userId: string, date: string): DiaryEntryWithFood[] {
    const stmt = db.prepare(`
      SELECT fd.*, f.*
      FROM food_diary fd
      LEFT JOIN foods f ON fd.food_id = f.id
      WHERE fd.user_id = ? AND fd.date = ?
      ORDER BY fd.meal_type, fd.created_at
    `);

    const rows = stmt.all(userId, date) as any[];

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      date: row.date,
      meal_type: row.meal_type,
      food_id: row.food_id,
      quantity: row.quantity,
      syn_value_consumed: row.syn_value_consumed,
      is_healthy_extra: row.is_healthy_extra,
      created_at: row.created_at,
      food: row.food_id ? {
        id: row.food_id,
        name: row.name,
        syn_value: row.syn_value,
        is_free_food: row.is_free_food,
        is_speed_food: row.is_speed_food,
        healthy_extra_type: row.healthy_extra_type,
        portion_size: row.portion_size,
        portion_unit: row.portion_unit,
        category: row.category,
        created_by: row.created_by,
        created_at: row.created_at
      } : undefined
    }));
  }

  static update(id: string, userId: string, data: Partial<DiaryEntry>): DiaryEntry | undefined {
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map(key => data[key as keyof DiaryEntry]);

    const stmt = db.prepare(`
      UPDATE food_diary SET ${fields} WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values, id, userId);
    return this.findById(id);
  }

  static delete(id: string, userId: string): boolean {
    const stmt = db.prepare('DELETE FROM food_diary WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static getDailySummary(userId: string, date: string) {
    const entries = this.findByUserAndDate(userId, date);

    const totalSyns = entries.reduce((sum, entry) => sum + entry.syn_value_consumed, 0);
    const healthyExtraAUsed = entries.some(entry => entry.is_healthy_extra && entry.food?.healthy_extra_type === 'A');
    const healthyExtraBUsed = entries.some(entry => entry.is_healthy_extra && entry.food?.healthy_extra_type === 'B');
    const speedFoodsCount = entries.filter(entry => entry.food?.is_speed_food).length;

    return {
      date,
      totalSyns,
      healthyExtraAUsed,
      healthyExtraBUsed,
      speedFoodsCount,
      entries
    };
  }
}
