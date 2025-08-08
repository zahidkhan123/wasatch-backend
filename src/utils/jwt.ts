import jwt from "jsonwebtoken";
import { IUser } from "../types/user.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "waste-management-secret-key";

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}
const options: jwt.SignOptions = { expiresIn: "30d" };
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    JWT_SECRET as jwt.Secret,
    options
  );
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
