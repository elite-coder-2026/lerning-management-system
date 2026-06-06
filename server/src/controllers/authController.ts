import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { loginSchema, registerSchema } from '../validation/authSchemas.js';
import { validate } from '../validation/shared.js';

export async function register(req: Request, res: Response) {
  const input = validate(registerSchema, req.body);
  const result = await authService.register(input);
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input);
  return res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.currentUser(req.user!.id);
  return res.json({ user });
}
