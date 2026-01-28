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
 * Based on Slimming World Free Foods guidelines:
 * - Meat & poultry: lean cuts, cooked without oil, skin removed, <5% fat mince
 * - Fat-free dairy: fat-free yogurt, Skyr, plain quark, plain soya yogurt with calcium
 * - Plant-based proteins: plain seitan, Quorn, textured soya, plain/smoked tofu
 * - Vegetables: almost all (fresh, frozen, canned, pickled in vinegar)
 * - Fish: fresh and frozen, cooked without fat
 * - Fruit: fresh and frozen (NOT juice, puréed or smoothies - these count as syns)
 * - Potatoes: all types, cooked without fat
 * - Beans, peas and lentils: fresh, frozen, canned in water, baked beans, mushy peas
 * - Eggs: boiled, poached, scrambled without butter/oil/fat
 * - Pasta, rice and grains: plain pasta, noodles, rice, couscous without fat/oil
 */
export const isFreeFood = (nutrition: NutritionalInfo, foodName: string): boolean => {
  const lowerName = foodName.toLowerCase();

  // Very low calorie foods (under 20 calories per 100g) are always free
  if ((nutrition.calories || 0) < 20) {
    return true;
  }

  // Disqualifying keywords - prepared foods, dishes with added fat/cheese, fruit drinks
  const excludeKeywords = [
    // Prepared dishes with fat
    'quiche', 'pie', 'tart', 'pastry', 'soup', 'sauce', 'cream', 'creamy',
    'fried', 'battered', 'breaded', 'crispy', 'chips', 'fries', 'deep fried',
    'salad dressing', 'mayo', 'mayonnaise', 'coleslaw',
    'butter', 'buttered', 'oil', 'roasted in', 'cooked in oil',
    // Prepared salads that contain dressing, cheese, or mayonnaise
    'caesar', 'waldorf', 'potato salad', 'pasta salad', 'egg salad',
    'chicken salad', 'tuna salad', 'coronation', 'nicoise',
    // Cheese (not fat-free)
    'cheese', 'cheddar', 'brie', 'parmesan', 'feta', 'mozzarella', 'stilton',
    // Fruit drinks and smoothies (count as syns per Slimming World)
    'juice', 'smoothie', 'puree', 'purée', 'puréed', 'fruit drink',
    // Processed/fatty meats
    'sausage', 'bacon', 'salami', 'chorizo', 'pepperoni'
  ];

  // If it contains disqualifying keywords, it's not free
  if (excludeKeywords.some(keyword => lowerName.includes(keyword))) {
    return false;
  }

  // Free food keywords organized by Slimming World categories
  const freeKeywords = [
    // Meat and poultry (lean cuts, cooked without oil)
    'chicken breast', 'chicken', 'turkey breast', 'turkey', 'lean beef', 'beef mince',
    'pork tenderloin', 'pork fillet', 'lean pork', 'ham', 'gammon', 'lean lamb',
    'venison', 'rabbit', 'pheasant', 'duck breast',

    // Fat-free dairy (handles both 'yogurt' and 'yoghurt' spellings)
    'fat-free yogurt', 'fat free yogurt', 'fat-free natural yogurt', 'fat free natural yogurt',
    'fat-free yoghurt', 'fat free yoghurt', 'fat-free natural yoghurt', 'fat free natural yoghurt',
    'fat free greek yogurt', 'fat-free greek yogurt', 'fat free greek yoghurt', 'fat-free greek yoghurt',
    'fat free authentic greek', '0% fat yogurt', '0% fat yoghurt', '0% yogurt', '0% yoghurt',
    'skyr', 'plain quark', 'quark', 'fat-free fromage frais', 'fat free fromage frais',
    'soya yogurt', 'soya yoghurt', 'plain soya',

    // Plant-based proteins
    'seitan', 'quorn', 'textured soya', 'tvp', 'textured vegetable protein',
    'tofu', 'smoked tofu', 'plain tofu', 'silken tofu', 'firm tofu',

    // Fish and seafood (fresh/frozen, cooked without fat)
    'white fish', 'cod', 'haddock', 'plaice', 'sole', 'sea bass', 'sea bream',
    'salmon', 'trout', 'mackerel', 'tuna', 'swordfish', 'halibut', 'monkfish',
    'prawns', 'shrimp', 'crab', 'lobster', 'mussels', 'clams', 'scallops', 'squid',
    'fish fillet', 'smoked fish', 'smoked salmon', 'smoked haddock', 'kippers',

    // Eggs
    'egg', 'eggs', 'boiled egg', 'poached egg', 'scrambled egg',

    // Vegetables (almost all are free)
    'broccoli', 'carrot', 'cauliflower', 'spinach', 'tomato', 'pepper', 'bell pepper',
    'lettuce', 'cucumber', 'celery', 'courgette', 'zucchini', 'mushroom',
    'cabbage', 'kale', 'sprouts', 'brussels', 'asparagus', 'green beans', 'runner beans',
    'aubergine', 'eggplant', 'onion', 'leek', 'garlic', 'shallot',
    'sweetcorn', 'corn on the cob', 'peas', 'mangetout', 'sugar snap',
    'beetroot', 'turnip', 'swede', 'parsnip', 'radish', 'fennel',
    'artichoke', 'chard', 'pak choi', 'bok choy', 'watercress', 'rocket', 'arugula',
    'spring onion', 'salad', 'mixed leaves', 'butternut squash', 'pumpkin',

    // Fruits (fresh and frozen only - NOT juice or smoothies)
    'apple', 'banana', 'orange', 'strawberry', 'strawberries', 'grape', 'grapes',
    'melon', 'watermelon', 'honeydew', 'cantaloupe', 'pineapple',
    'blueberry', 'blueberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries',
    'pear', 'peach', 'nectarine', 'plum', 'apricot', 'cherry', 'cherries',
    'kiwi', 'mango', 'papaya', 'passion fruit', 'pomegranate', 'fig', 'figs',
    'grapefruit', 'lime', 'lemon', 'tangerine', 'clementine', 'satsuma',
    'frozen fruit', 'fresh fruit', 'mixed berries',

    // Potatoes (cooked without fat)
    'potato', 'potatoes', 'new potatoes', 'sweet potato', 'sweet potatoes',
    'baked potato', 'boiled potato', 'mashed potato', 'jacket potato',

    // Beans, peas and lentils
    'beans', 'kidney beans', 'black beans', 'cannellini', 'butter beans', 'haricot',
    'borlotti', 'pinto beans', 'broad beans', 'edamame',
    'baked beans', 'mushy peas', 'garden peas', 'chickpeas', 'chickpea',
    'lentils', 'red lentils', 'green lentils', 'puy lentils', 'brown lentils',

    // Pasta, rice and grains (plain, without fat/oil)
    'pasta', 'spaghetti', 'penne', 'fusilli', 'tagliatelle', 'linguine', 'macaroni',
    'rice', 'basmati', 'long grain', 'brown rice', 'wild rice', 'jasmine rice',
    'noodles', 'egg noodles', 'rice noodles', 'udon', 'soba',
    'couscous', 'bulgur', 'bulgur wheat', 'quinoa', 'pearl barley', 'freekeh'
  ];

  // Check if the food matches any free food keyword
  const matchesFreeFood = freeKeywords.some(keyword => lowerName.includes(keyword));

  if (!matchesFreeFood) {
    return false;
  }

  // Additional nutritional validation for items that matched keywords
  // Some items may have free food names but be prepared with fat
  const calories = nutrition.calories || 0;
  const saturatedFat = nutrition.saturatedFat || 0;

  // More lenient thresholds since many free foods like potatoes have higher calories
  // but are still free when prepared without fat
  // Most plain free foods are under 200 cal/100g and low in saturated fat
  if (calories > 250 || saturatedFat > 5) {
    return false;
  }

  return true;
};

/**
 * Determine if a food is a "speed food" (fruits and vegetables)
 * Speed foods are a subset of Free Foods that help fill you up
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

  // Exclude fruit juice and smoothies (these are NOT speed foods - they have syns)
  const excludeKeywords = ['juice', 'smoothie', 'puree', 'purée', 'dried'];
  if (excludeKeywords.some(keyword => lowerName.includes(keyword))) {
    return false;
  }

  // Comprehensive list of speed food keywords (fruits and vegetables)
  const speedKeywords = [
    // Fruits
    'apple', 'banana', 'orange', 'strawberry', 'strawberries', 'grape', 'grapes',
    'melon', 'watermelon', 'honeydew', 'cantaloupe', 'pineapple',
    'blueberry', 'blueberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries',
    'pear', 'peach', 'nectarine', 'plum', 'apricot', 'cherry', 'cherries',
    'kiwi', 'mango', 'papaya', 'passion fruit', 'pomegranate', 'fig',
    'grapefruit', 'tangerine', 'clementine', 'satsuma',
    // Vegetables
    'broccoli', 'carrot', 'cauliflower', 'spinach', 'tomato', 'pepper', 'bell pepper',
    'courgette', 'zucchini', 'mushroom', 'lettuce', 'cucumber', 'cabbage',
    'kale', 'sprouts', 'brussels', 'asparagus', 'green beans', 'runner beans',
    'aubergine', 'eggplant', 'onion', 'leek', 'shallot',
    'sweetcorn', 'peas', 'mangetout', 'sugar snap',
    'beetroot', 'turnip', 'swede', 'radish', 'fennel',
    'artichoke', 'chard', 'pak choi', 'bok choy', 'watercress', 'rocket',
    'butternut squash', 'pumpkin', 'celery'
  ];

  return speedKeywords.some(keyword => lowerName.includes(keyword));
};

export default {
  calculateSyns,
  isFreeFood,
  isSpeedFood
};
