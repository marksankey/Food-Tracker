/**
 * Calculate Slimming World syn values from nutritional information
 * Based on the Slimming World syn calculation formula
 */

interface NutritionalInfo {
  calories?: number;
  saturatedFat?: number;
  sugars?: number;
  protein?: number;
}

/**
 * Calculate syns per 100g using the Slimming World formula
 * Formula: The higher of:
 * 1. Calories / 20
 * 2. (Calories + (Sat Fat × 12) + (Sugars × 1)) / 50
 *
 * Note: This is an approximation based on publicly available information
 */
export const calculateSyns = (nutrition: NutritionalInfo): number => {
  const { calories = 0, saturatedFat = 0, sugars = 0 } = nutrition;

  // Method 1: Simple calorie calculation
  const method1 = calories / 20;

  // Method 2: Combined calculation including saturated fat and sugar
  const method2 = (calories + (saturatedFat * 12) + sugars) / 50;

  // Use the higher value (more conservative)
  const syns = Math.max(method1, method2);

  // Round to 0.5 increments (standard SW practice)
  return Math.round(syns * 2) / 2;
};

/**
 * Determine if a food should be considered "free"
 * Free foods are typically lean proteins, fruits, vegetables, and certain carbs
 */
export const isFreeFood = (nutrition: NutritionalInfo, foodName: string): boolean => {
  const lowerName = foodName.toLowerCase();

  // Very low calorie foods (under 20 calories per 100g)
  if ((nutrition.calories || 0) < 20) {
    return true;
  }

  // Disqualifying keywords - prepared foods, dishes with added fat/cheese
  const excludeKeywords = [
    'quiche', 'pie', 'tart', 'pastry', 'soup', 'sauce', 'cream', 'creamy',
    'cheese', 'cheddar', 'brie', 'parmesan', 'feta', 'mozzarella',
    'fried', 'battered', 'breaded', 'crispy', 'chips', 'fries',
    'salad dressing', 'mayo', 'mayonnaise', 'coleslaw',
    'butter', 'buttered', 'oil', 'roasted in'
  ];

  // If it contains disqualifying keywords, it's not free
  if (excludeKeywords.some(keyword => lowerName.includes(keyword))) {
    return false;
  }

  // Nutritional checks - free foods must be low in calories and fat
  const calories = nutrition.calories || 0;
  const saturatedFat = nutrition.saturatedFat || 0;

  // If too high in calories or saturated fat, can't be free
  // Even if it contains a free food name
  if (calories > 100 || saturatedFat > 2) {
    return false;
  }

  // List of keywords for free foods (plain vegetables, fruits, lean proteins)
  const freeKeywords = [
    'egg', 'chicken breast', 'turkey breast', 'white fish', 'cod', 'haddock',
    'prawns', 'shrimp', 'tofu', 'quorn',
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'melon',
    'broccoli', 'carrot', 'cauliflower', 'spinach', 'tomato', 'pepper',
    'lettuce', 'cucumber', 'celery'
  ];

  return freeKeywords.some(keyword => lowerName.includes(keyword));
};

/**
 * Determine if a food is a "speed food" (typically fruits and vegetables)
 */
export const isSpeedFood = (foodName: string, categories?: string[]): boolean => {
  const lowerName = foodName.toLowerCase();

  // Check categories if provided
  if (categories) {
    const speedCategories = ['fruits', 'vegetables', 'fruit', 'vegetable'];
    if (categories.some(cat => speedCategories.includes(cat.toLowerCase()))) {
      return true;
    }
  }

  // List of keywords for speed foods
  const speedKeywords = [
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'melon', 'pineapple',
    'broccoli', 'carrot', 'cauliflower', 'spinach', 'tomato', 'pepper',
    'courgette', 'zucchini', 'mushroom', 'lettuce', 'cucumber', 'cabbage'
  ];

  return speedKeywords.some(keyword => lowerName.includes(keyword));
};

export default {
  calculateSyns,
  isFreeFood,
  isSpeedFood
};
