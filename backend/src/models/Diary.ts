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

  static findByUserAndDate(userId: string, date: string): any[] {
    const stmt = db.prepare(`
      SELECT
        fd.id as diary_id,
        fd.user_id as diary_user_id,
        fd.date as diary_date,
        fd.meal_type as diary_meal_type,
        fd.food_id as diary_food_id,
        fd.quantity as diary_quantity,
        fd.syn_value_consumed as diary_syn_value_consumed,
        fd.is_healthy_extra as diary_is_healthy_extra,
        fd.created_at as diary_created_at,
        f.id as food_id,
        f.name as food_name,
        f.syn_value as food_syn_value,
        f.is_free_food as food_is_free_food,
        f.is_speed_food as food_is_speed_food,
        f.healthy_extra_type as food_healthy_extra_type,
        f.portion_size as food_portion_size,
        f.portion_unit as food_portion_unit,
        f.category as food_category,
        f.created_by as food_created_by,
        f.created_at as food_created_at
      FROM food_diary fd
      LEFT JOIN foods f ON fd.food_id = f.id
      WHERE fd.user_id = ? AND fd.date = ?
      ORDER BY fd.meal_type, fd.created_at
    `);

    const rows = stmt.all(userId, date) as any[];

    return rows.map(row => ({
      id: row.diary_id,
      userId: row.diary_user_id,
      date: row.diary_date,
      mealType: row.diary_meal_type,
      foodId: row.diary_food_id,
      quantity: row.diary_quantity,
      synValueConsumed: row.diary_syn_value_consumed,
      isHealthyExtra: Boolean(row.diary_is_healthy_extra),
      createdAt: row.diary_created_at,
      food: row.food_id ? {
        id: row.food_id,
        name: row.food_name,
        synValue: row.food_syn_value,
        isFreeFood: Boolean(row.food_is_free_food),
        isSpeedFood: Boolean(row.food_is_speed_food),
        healthyExtraType: row.food_healthy_extra_type || undefined,
        portionSize: row.food_portion_size,
        portionUnit: row.food_portion_unit,
        category: row.food_category,
        createdBy: row.food_created_by || undefined,
        createdAt: row.food_created_at
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

    const totalSyns = entries.reduce((sum, entry) => sum + entry.synValueConsumed, 0);
    const healthyExtraAUsed = entries.some(entry => entry.isHealthyExtra && entry.food?.healthyExtraType === 'A');
    const healthyExtraBUsed = entries.some(entry => entry.isHealthyExtra && entry.food?.healthyExtraType === 'B');
    const speedFoodsCount = entries.filter(entry => entry.food?.isSpeedFood).length;

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
