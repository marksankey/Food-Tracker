import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  notes?: string;
  created_at: string;
}

// Helper function to transform snake_case to camelCase
const transformWeightLog = (log: WeightLog) => ({
  id: log.id,
  userId: log.user_id,
  date: log.date,
  weight: log.weight,
  notes: log.notes,
  createdAt: log.created_at
});

export class WeightModel {
  static async create(userId: string, data: Omit<WeightLog, 'id' | 'user_id' | 'created_at'>): Promise<any> {
    const id = uuidv4();

    await pool.query(
      `INSERT INTO weight_logs (id, user_id, date, weight, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, data.date, data.weight, data.notes || null]
    );

    return await this.findById(id);
  }

  static async findById(id: string): Promise<any | undefined> {
    const result = await pool.query('SELECT * FROM weight_logs WHERE id = $1', [id]);
    const log = result.rows[0] as WeightLog | undefined;
    return log ? transformWeightLog(log) : undefined;
  }

  static async findByUser(userId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    const logs = result.rows as WeightLog[];
    return logs.map(transformWeightLog);
  }

  static async update(id: string, userId: string, data: Partial<WeightLog>): Promise<any | undefined> {
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map(key => data[key as keyof WeightLog]);

    await pool.query(
      `UPDATE weight_logs SET ${fields} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`,
      [...values, id, userId]
    );

    return this.findById(id);
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM weight_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
