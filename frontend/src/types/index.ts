export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  height?: number;
  dailySynAllowance: number;
  healthyExtraAAllowance: number;
  healthyExtraBAllowance: number;
}

export interface Food {
  id: string;
  name: string;
  synValue: number;
  isFreeFood: boolean;
  isSpeedFood: boolean;
  healthyExtraType?: 'A' | 'B';
  portionSize: number;
  portionUnit: string;
  category: string;
  createdBy?: string;
}

export interface FoodDiaryEntry {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foodId: string;
  food?: Food;
  quantity: number;
  synValueConsumed: number;
  isHealthyExtra: boolean;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface DailySummary {
  date: string;
  totalSyns: number;
  remainingSyns: number;
  healthyExtraAUsed: boolean;
  healthyExtraBUsed: boolean;
  speedFoodsCount: number;
  entries: FoodDiaryEntry[];
}

export interface AuthResponse {
  token: string;
  user: User;
  profile: UserProfile;
}
