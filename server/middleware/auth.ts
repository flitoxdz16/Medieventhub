import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Add user property to Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded as {
      id: number;
      email: string;
      role: string;
      permissions: string[];
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admins always have all permissions
    if (req.user.role === "super_admin") {
      return next();
    }

    // Check if user has the required permission
    if (req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: "Permission denied" });
  };
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: "Access denied: Insufficient role privileges" });
  };
};
