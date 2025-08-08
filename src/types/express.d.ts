import { UserType } from "../types/enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        role: UserType;
      };
    }
  }
}
