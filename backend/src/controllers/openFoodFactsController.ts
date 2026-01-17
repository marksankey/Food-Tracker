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
    const synValuePer100g = calculateSyns(nutrition);
    const productName = product.product_name || 'Unknown Product';

    // Scale syn value from per-100g to per-serving
    const servingSizeStr = product.serving_size || '100g';
    // Extract number from strings like "1 serving (14 g)" or "20 g"
    const match = servingSizeStr.match(/\((\d+\.?\d*)\s*g\)|(\d+\.?\d*)\s*g/);
    const portionSize = match ? parseFloat(match[1] || match[2]) : 100;
    const scaledSynValue = synValuePer100g * (portionSize / 100);

    // Check if this is a free food
    const isProductFreeFood = isFreeFood(nutrition, productName);
    const finalSynValue = isProductFreeFood ? 0 : Math.round(scaledSynValue * 2) / 2;

    // Debug logging
    console.log(`[Barcode Scan] ${productName}`);
    console.log(`  Nutrition:`, nutrition);
    console.log(`  Syn per 100g: ${synValuePer100g}`);
    console.log(`  Serving size: ${servingSizeStr} -> ${portionSize}g`);
    console.log(`  Scaled syn: ${scaledSynValue} -> ${Math.round(scaledSynValue * 2) / 2}`);
    console.log(`  Is free food: ${isProductFreeFood}`);
    console.log(`  Final syn value: ${finalSynValue}`);

    res.json({
      barcode: product.code,
      name: `${productName}${product.brands ? ` (${product.brands})` : ''}`,
      synValue: finalSynValue,
      isFreeFood: isProductFreeFood,
      isSpeedFood: isSpeedFood(productName, product.categories_tags),
      nutrition,
      image: product.image_url,
      servingSize: servingSizeStr,
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
      try {
        const nutrition = getNutrition(product);
        const synValuePer100g = calculateSyns(nutrition);
        const productName = product.product_name || 'Unknown Product';

        // Scale syn value from per-100g to per-serving
        const servingSizeStr = product.serving_size || '100g';
        // Extract number from strings like "1 serving (14 g)" or "20 g"
        const match = servingSizeStr.match(/\((\d+\.?\d*)\s*g\)|(\d+\.?\d*)\s*g/);
        const portionSize = match ? parseFloat(match[1] || match[2]) : 100;
        const scaledSynValue = synValuePer100g * (portionSize / 100);

        // Check if this is a free food - free foods always have 0 syns
        const isProductFreeFood = isFreeFood(nutrition, productName);
        const finalSynValue = isProductFreeFood ? 0 : Math.round(scaledSynValue * 2) / 2;

        return {
          barcode: product.code,
          name: `${productName}${product.brands ? ` (${product.brands})` : ''}`,
          synValue: finalSynValue,
          isFreeFood: isProductFreeFood,
          isSpeedFood: isSpeedFood(productName, product.categories_tags),
          nutrition,
          image: product.image_url,
          servingSize: servingSizeStr,
          categories: product.categories_tags || []
        };
      } catch (error) {
        console.error(`Error processing product ${product.code}:`, error);
        // Return product with default values if processing fails
        return {
          barcode: product.code,
          name: product.product_name || 'Unknown Product',
          synValue: 0,
          isFreeFood: false,
          isSpeedFood: false,
          nutrition: {},
          image: product.image_url,
          servingSize: '100g',
          categories: []
        };
      }
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

    // Parse serving size and scale syn value from per-100g to per-serving
    // Extract number from strings like "1 serving (14 g)" or "20 g"
    const match = servingSize?.match(/\((\d+\.?\d*)\s*g\)|(\d+\.?\d*)\s*g/);
    const portionSize = match ? parseFloat(match[1] || match[2]) : (parseFloat(servingSize) || 100);
    const scaledSynValue = synValue ? (synValue * portionSize / 100) : 0;

    const food = FoodModel.create({
      name,
      syn_value: scaledSynValue,
      is_free_food: isFree ? 1 : 0,
      is_speed_food: isSpeed ? 1 : 0,
      portion_size: portionSize,
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
