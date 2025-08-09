// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { Employee } from "../models/employee/employee.model.js";
import { Admin } from "../models/admin/admin.model.js";
import { UserType } from "../types/enums.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
    role?: string;
    _id?: string;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    let user;

    switch (decoded.role) {
      case "user":
        user = await User.findById(decoded.id);
        break;
      case "employee":
        user = await Employee.findById(decoded.id);
        break;
      case "admin":
      case "superadmin":
        user = await Admin.findById(decoded.id);
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    req.user = user;
    req.role = decoded.role;
    req._id = decoded.id;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Allow only admins & superadmins
export const adminAuthMiddleware = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.role === "admin") {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Admins only" });
  },
];

// Allow only superadmins
export const superAdminOnlyMiddleware = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.role === "superadmin") {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Super Admins only" });
  },
];

// Allow only employees (+ higher)
export const employeeAuthMiddleware = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if (
      req.role === "employee" ||
      req.role === "admin" ||
      req.role === "superadmin"
    ) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Employees only" });
  },
];

// Allow only users (not employees/admins/superadmins)
export const userAuthMiddleware = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.role === "user" || req.role === UserType.USER) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Users only" });
  },
];

// Allow any authenticated user, employee, or admin
export const authorize = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    console.log(req.role);
    if (
      req.role === UserType.USER ||
      req.role === UserType.EMPLOYEE ||
      req.role === UserType.ADMIN
    ) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Users only" });
  },
];
