import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '@config/env.js';

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
