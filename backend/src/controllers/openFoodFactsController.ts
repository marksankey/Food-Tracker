import { Response } from 'express';
import { AuthRequest } from '../middleware/noauth.js';
import { getProductByBarcode, searchProducts, getNutrition } from '../services/openFoodFacts.js';
import { calculateSyns, isFreeFood, isSpeedFood } from '../utils/synCalculator.js';
import { FoodModel } from '../models/Food.js';

/**
 * Search products by barcode
 */
export const searchByBarcode = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const product = await getProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const nutrition = getNutrition(product);
    const synValue = calculateSyns(nutrition);
    const productName = product.product_name || 'Unknown Product';

    res.json({
      barcode: product.code,
      name: `${productName}${product.brands ? ` (${product.brands})` : ''}`,
      synValue,
      isFreeFood: isFreeFood(nutrition, productName),
      isSpeedFood: isSpeedFood(productName, product.categories_tags),
      nutrition,
      image: product.image_url,
      servingSize: product.serving_size || '100g',
      categories: product.categories_tags || []
    });
  } catch (error) {
    console.error('Barcode search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Search products by name
 */
export const searchByName = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const results = await searchProducts(query, page, 10);

    const productsWithSyns = results.products.map(product => {
      const nutrition = getNutrition(product);
      const synValue = calculateSyns(nutrition);
      const productName = product.product_name || 'Unknown Product';

      return {
        barcode: product.code,
        name: `${productName}${product.brands ? ` (${product.brands})` : ''}`,
        synValue,
        isFreeFood: isFreeFood(nutrition, productName),
        isSpeedFood: isSpeedFood(productName, product.categories_tags),
        nutrition,
        image: product.image_url,
        servingSize: product.serving_size || '100g',
        categories: product.categories_tags || []
      };
    });

    res.json({
      products: productsWithSyns,
      count: results.count,
      page: results.page,
      pageSize: results.page_size
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Save a product from Open Food Facts to the local database
 */
export const saveProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode, name, synValue, isFree, isSpeed, servingSize } = req.body;

    if (!barcode || !name) {
      return res.status(400).json({ message: 'Barcode and name are required' });
    }

    // Check if product already exists
    const existingFood = await FoodModel.search(barcode, {});
    if (existingFood.length > 0) {
      return res.status(400).json({ message: 'Product already exists in database' });
    }

    const food = FoodModel.create({
      name,
      syn_value: synValue || 0,
      is_free_food: isFree ? 1 : 0,
      is_speed_food: isSpeed ? 1 : 0,
      portion_size: parseFloat(servingSize) || 100,
      portion_unit: 'g',
      category: 'commercial',
      healthy_extra_type: undefined
    }, req.userId);

    res.status(201).json(food);
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
