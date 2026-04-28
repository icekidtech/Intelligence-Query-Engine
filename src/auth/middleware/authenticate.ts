import { Request, Response, NextFunction } from 'express';
import { TokenService, TokenPayload } from '../token.service';
import { AppDataSource } from '../../database';
import { User } from '../../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      userId?: string;
    }
  }
}

/**
 * Authentication Middleware
 * Validates JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = TokenService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Check if token is expired
    if (TokenService.isTokenExpired(token)) {
      res.status(401).json({
        status: 'error',
        message: 'Token expired',
      });
      return;
    }

    // Check if user is active
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      res.status(403).json({
        status: 'error',
        message: 'User account deactivated',
      });
      return;
    }

    // Attach user info to request
    req.user = decoded;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
    });
  }
};
