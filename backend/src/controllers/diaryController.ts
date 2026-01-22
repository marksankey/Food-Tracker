import { Response } from 'express';
import { DiaryModel } from '../models/Diary.js';
import { AuthRequest } from '../middleware/noauth.js';
import { UserModel } from '../models/User.js';

export const getDiaryEntries = async (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const entries = await DiaryModel.findByUserAndDate(req.userId!, date);
    res.json(entries);
  } catch (error) {
    console.error('Get diary entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDailySummary = async (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const summary = await DiaryModel.getDailySummary(req.userId!, date);
    const profile = await UserModel.getProfile(req.userId!);

    res.json({
      ...summary,
      remainingSyns: (profile?.dailySynAllowance || 15) - summary.totalSyns
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDiaryEntry = async (req: AuthRequest, res: Response) => {
  try {
    // Transform camelCase from frontend to snake_case for database
    const entryData = {
      date: req.body.date,
      meal_type: req.body.mealType,
      food_id: req.body.foodId,
      quantity: req.body.quantity,
      syn_value_consumed: req.body.synValueConsumed,
      is_healthy_extra: req.body.isHealthyExtra ? 1 : 0
    };

    const entry = await DiaryModel.create(req.userId!, entryData);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create diary entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDiaryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await DiaryModel.update(req.params.id, req.userId!, req.body);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Update diary entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDiaryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await DiaryModel.delete(req.params.id, req.userId!);
    if (!deleted) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete diary entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
