import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  notes?: string;
  created_at: string;
}

export class WeightModel {
  static create(userId: string, data: Omit<WeightLog, 'id' | 'user_id' | 'created_at'>): WeightLog {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO weight_logs (id, user_id, date, weight, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, userId, data.date, data.weight, data.notes || null);
    return this.findById(id)!;
  }

  static findById(id: string): WeightLog | undefined {
    const stmt = db.prepare('SELECT * FROM weight_logs WHERE id = ?');
    return stmt.get(id) as WeightLog | undefined;
  }

  static findByUser(userId: string): WeightLog[] {
    const stmt = db.prepare('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date DESC');
    return stmt.all(userId) as WeightLog[];
  }

  static update(id: string, userId: string, data: Partial<WeightLog>): WeightLog | undefined {
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map(key => data[key as keyof WeightLog]);

    const stmt = db.prepare(`
      UPDATE weight_logs SET ${fields} WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values, id, userId);
    return this.findById(id);
  }

  static delete(id: string, userId: string): boolean {
    const stmt = db.prepare('DELETE FROM weight_logs WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
}
