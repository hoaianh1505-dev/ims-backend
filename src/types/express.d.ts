import { UserRole } from '../modules/users/entities/user.entity';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: UserRole;
    }

    interface Request {
      userId?: string;
      user?: User;
    }
  }
}