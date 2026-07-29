import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as userService from '@services/user.service.js';
import { UnauthorizedError } from '@utils/AppError.js';
import type {
  CreateUserInput,
  UpdateUserRoleInput,
  UserSearchQuery,
} from '@validators/user.validator.js';

export async function listUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = res.locals.query as UserSearchQuery;
  const result = await userService.listUsers(query);
  res.status(200).json({ success: true, ...result });
}

export async function getUserById(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const user = await userService.getUserById(id);
  res.status(200).json({ success: true, data: user });
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const input = req.body as CreateUserInput;
  const user = await userService.createUser(input);
  res.status(201).json({ success: true, data: user });
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  const { id } = res.locals.params as { id: string };
  const input = req.body as UpdateUserRoleInput;
  const user = await userService.updateUserRole(id, input, req.user.userId);
  res.status(200).json({ success: true, data: user });
}
