import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isHost: boolean;
    isAgent: boolean;
    isVerified: boolean;
    userType?: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'JWT secret not configured',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

    // Get user from Supabase database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, is_suspended, is_host, is_agent, is_verified')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.is_active || user.is_suspended) {
      return res.status(401).json({
        success: false,
        error: 'Account is suspended or inactive',
      });
    }

    // Add user to request object (map snake_case to camelCase for consistency)
    req.user = {
      id: user.id,
      email: user.email,
      isHost: user.is_host,
      isAgent: user.is_agent,
      isVerified: user.is_verified,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Middleware to check if user is a host
export const requireHost = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isHost) {
    return res.status(403).json({
      success: false,
      error: 'Host access required',
    });
  }
  next();
};

// Middleware to check if user is an agent
export const requireAgent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAgent) {
    return res.status(403).json({
      success: false,
      error: 'Agent access required',
    });
  }
  next();
};

// Middleware to check if user is verified
export const requireVerified = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
    });
  }
  next();
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    // Check if user is admin - must be agent and have admin in email
    const isAdmin = req.user?.email?.includes('admin') && req.user?.isAgent;

    if (!isAdmin) {
      res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}; 