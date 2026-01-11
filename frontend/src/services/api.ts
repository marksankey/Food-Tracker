import axios from 'axios';
import type { User, UserProfile, Food, FoodDiaryEntry, WeightLog, DailySummary, AuthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  getProfile: () =>
    api.get<{ user: User; profile: UserProfile }>('/auth/profile'),

  updateProfile: (data: Partial<UserProfile>) =>
    api.put<UserProfile>('/auth/profile', data),
};

// Food API
export const foodAPI = {
  search: (query: string, filters?: { category?: string; isFreeFood?: boolean; isSpeedFood?: boolean }) =>
    api.get<Food[]>('/foods/search', { params: { q: query, ...filters } }),

  getById: (id: string) =>
    api.get<Food>(`/foods/${id}`),

  create: (data: Omit<Food, 'id' | 'createdBy'>) =>
    api.post<Food>('/foods', data),

  getAll: (limit?: number, offset?: number) =>
    api.get<Food[]>('/foods', { params: { limit, offset } }),
};

// Food Diary API
export const diaryAPI = {
  getByDate: (date: string) =>
    api.get<FoodDiaryEntry[]>('/diary', { params: { date } }),

  getDailySummary: (date: string) =>
    api.get<DailySummary>('/diary/summary', { params: { date } }),

  addEntry: (data: Omit<FoodDiaryEntry, 'id' | 'userId'>) =>
    api.post<FoodDiaryEntry>('/diary', data),

  updateEntry: (id: string, data: Partial<FoodDiaryEntry>) =>
    api.put<FoodDiaryEntry>(`/diary/${id}`, data),

  deleteEntry: (id: string) =>
    api.delete(`/diary/${id}`),
};

// Weight Log API
export const weightAPI = {
  getAll: () =>
    api.get<WeightLog[]>('/weight'),

  add: (data: Omit<WeightLog, 'id' | 'userId'>) =>
    api.post<WeightLog>('/weight', data),

  update: (id: string, data: Partial<WeightLog>) =>
    api.put<WeightLog>(`/weight/${id}`, data),

  delete: (id: string) =>
    api.delete(`/weight/${id}`),
};

// Open Food Facts API
export interface ProductNutrition {
  calories: number;
  saturatedFat: number;
  sugars: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  salt: number;
}

export interface Product {
  barcode: string;
  name: string;
  synValue: number;
  isFreeFood: boolean;
  isSpeedFood: boolean;
  nutrition: ProductNutrition;
  image?: string;
  servingSize: string;
  categories: string[];
}

export interface ProductSearchResult {
  products: Product[];
  count: number;
  page: number;
  pageSize: number;
}

export const productsAPI = {
  searchByBarcode: (barcode: string) =>
    api.get<Product>(`/products/barcode/${barcode}`),

  searchByName: (query: string, page?: number) =>
    api.get<ProductSearchResult>('/products/search', { params: { q: query, page } }),

  saveProduct: (data: {
    barcode: string;
    name: string;
    synValue: number;
    isFree: boolean;
    isSpeed: boolean;
    servingSize: string;
  }) =>
    api.post<Food>('/products/save', data),
};

export default api;
