import { Response } from 'express';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/noauth.js';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = UserModel.findById(req.userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = UserModel.getProfile(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = UserModel.updateProfile(req.userId!, req.body);
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
