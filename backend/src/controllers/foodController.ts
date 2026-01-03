import { Response } from 'express';
import { FoodModel } from '../models/Food.js';
import { AuthRequest } from '../middleware/auth.js';

export const getFoods = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const foods = FoodModel.findAll(limit, offset);
    res.json(foods);
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchFoods = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    const filters = {
      category: req.query.category as string,
      is_free_food: req.query.isFreeFood === 'true' ? true : undefined,
      is_speed_food: req.query.isSpeedFood === 'true' ? true : undefined
    };

    const foods = FoodModel.search(query, filters);
    res.json(foods);
  } catch (error) {
    console.error('Search foods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFood = async (req: AuthRequest, res: Response) => {
  try {
    const food = FoodModel.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.json(food);
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFood = async (req: AuthRequest, res: Response) => {
  try {
    const food = FoodModel.create(req.body, req.userId);
    res.status(201).json(food);
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
