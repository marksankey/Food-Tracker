import axios from 'axios';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'fat_100g'?: number;
    'saturated-fat_100g'?: number;
    'carbohydrates_100g'?: number;
    'sugars_100g'?: number;
    'fiber_100g'?: number;
    'proteins_100g'?: number;
    'salt_100g'?: number;
  };
  categories?: string;
  categories_tags?: string[];
  image_url?: string;
  serving_size?: string;
  countries_tags?: string[];
}

export interface OpenFoodFactsResponse {
  code: string;
  product?: OpenFoodFactsProduct;
  status: number;
  status_verbose: string;
}

export interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

/**
 * Search for products by barcode
 */
export const getProductByBarcode = async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
  try {
    const response = await axios.get<OpenFoodFactsResponse>(
      `${OPEN_FOOD_FACTS_API}/product/${barcode}`
    );

    if (response.data.status === 1 && response.data.product) {
      return response.data.product;
    }

    return null;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
};

/**
 * Search for products by name
 * Note: Using v1 API (/cgi/search.pl) because v2 doesn't support full text search
 */
export const searchProducts = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<OpenFoodFactsSearchResult> => {
  try {
    const response = await axios.get<OpenFoodFactsSearchResult>(
      'https://world.openfoodfacts.org/cgi/search.pl',
      {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page,
          page_size: pageSize,
          tagtype_0: 'countries',
          tag_contains_0: 'contains',
          tag_0: 'united-kingdom', // Prioritize UK products
          sort_by: 'unique_scans_n' // Sort by popularity (unique scans)
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      products: [],
      count: 0,
      page: 1,
      page_size: pageSize
    };
  }
};

/**
 * Get nutritional information formatted for syn calculation
 */
export const getNutrition = (product: OpenFoodFactsProduct) => {
  return {
    calories: product.nutriments?.['energy-kcal_100g'] || 0,
    saturatedFat: product.nutriments?.['saturated-fat_100g'] || 0,
    sugars: product.nutriments?.['sugars_100g'] || 0,
    protein: product.nutriments?.['proteins_100g'] || 0,
    carbs: product.nutriments?.['carbohydrates_100g'] || 0,
    fat: product.nutriments?.['fat_100g'] || 0,
    fiber: product.nutriments?.['fiber_100g'] || 0,
    salt: product.nutriments?.['salt_100g'] || 0
  };
};

export default {
  getProductByBarcode,
  searchProducts,
  getNutrition
};
