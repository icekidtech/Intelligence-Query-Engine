import { Request, Response, NextFunction } from 'express';

/**
 * Authorization Middleware
 * Enforces role-based access control
 */
export const authorize = (allowedRoles: ('admin' | 'analyst')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Forbidden',
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only authorization
 */
export const requireAdmin = authorize(['admin']);

/**
 * Analyst or Admin authorization
 */
export const requireAnalystOrAdmin = authorize(['analyst', 'admin']);
