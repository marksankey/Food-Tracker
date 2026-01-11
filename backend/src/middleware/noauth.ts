import { Request, Response, NextFunction } from 'express';

// Default user ID for personal app (no authentication needed)
const DEFAULT_USER_ID = 'default-user';

export interface AuthRequest extends Request {
  userId?: string;
}

// Simple middleware that adds default user ID to all requests
export const addDefaultUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.userId = DEFAULT_USER_ID;
  next();
};

// Export for compatibility (not used anymore)
export const authenticateToken = addDefaultUser;
export const generateToken = (userId: string) => 'not-needed';
