import { Response } from 'express';
import { WeightModel } from '../models/Weight.js';
import { AuthRequest } from '../middleware/auth.js';

export const getWeightLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = WeightModel.findByUser(req.userId!);
    res.json(logs);
  } catch (error) {
    console.error('Get weight logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createWeightLog = async (req: AuthRequest, res: Response) => {
  try {
    const log = WeightModel.create(req.userId!, req.body);
    res.status(201).json(log);
  } catch (error) {
    console.error('Create weight log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWeightLog = async (req: AuthRequest, res: Response) => {
  try {
    const log = WeightModel.update(req.params.id, req.userId!, req.body);
    if (!log) {
      return res.status(404).json({ message: 'Weight log not found' });
    }
    res.json(log);
  } catch (error) {
    console.error('Update weight log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteWeightLog = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = WeightModel.delete(req.params.id, req.userId!);
    if (!deleted) {
      return res.status(404).json({ message: 'Weight log not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete weight log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
