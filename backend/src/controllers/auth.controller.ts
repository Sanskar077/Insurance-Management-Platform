import type { Request, Response } from 'express';
import { registerUser, loginUser } from '@services/auth.service.js';
import type { RegisterInput, LoginInput } from '@validators/auth.validator.js';

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await registerUser(input);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await loginUser(input);
  res.status(200).json({ success: true, data: result });
}
