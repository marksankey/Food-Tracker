import { Response } from 'express';
import { FoodModel, Food } from '../models/Food.js';
import { AuthRequest } from '../middleware/noauth.js';

// Helper function to transform snake_case database fields to camelCase for frontend
const transformFoodForFrontend = (food: Food) => ({
  id: food.id,
  name: food.name,
  synValue: food.syn_value,
  isFreeFood: Boolean(food.is_free_food),
  isSpeedFood: Boolean(food.is_speed_food),
  healthyExtraType: food.healthy_extra_type || undefined,
  portionSize: food.portion_size,
  portionUnit: food.portion_unit,
  category: food.category,
  createdBy: food.created_by || undefined,
  createdAt: food.created_at
});

export const getFoods = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const foods = await FoodModel.findAll(limit, offset);
    const transformedFoods = foods.map(transformFoodForFrontend);
    res.json(transformedFoods);
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

    const foods = await FoodModel.search(query, filters);
    const transformedFoods = foods.map(transformFoodForFrontend);
    res.json(transformedFoods);
  } catch (error) {
    console.error('Search foods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFood = async (req: AuthRequest, res: Response) => {
  try {
    const food = await FoodModel.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.json(transformFoodForFrontend(food));
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFood = async (req: AuthRequest, res: Response) => {
  try {
    const food = await FoodModel.create(req.body, req.userId);
    res.status(201).json(transformFoodForFrontend(food));
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecentFoods = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 100;

    const foods = await FoodModel.findRecent(days, limit);
    const transformedFoods = foods.map(transformFoodForFrontend);
    res.json(transformedFoods);
  } catch (error) {
    console.error('Get recent foods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFood = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await FoodModel.delete(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Food not found or you do not have permission to delete it' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
