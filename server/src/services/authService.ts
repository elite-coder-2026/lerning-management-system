import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import * as users from '../repositories/userRepository.js';
import type { PublicUser, Role } from '../types/models.js';

export type AuthResult = {
  user: PublicUser;
  token: string;
};

function signToken(user: PublicUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, secret, { expiresIn: '8h' });
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await users.createUser(pool, {
    email: input.email.toLowerCase(),
    passwordHash,
    fullName: input.fullName,
    role: input.role,
  });

  return { user, token: signToken(user) };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await users.findUserByEmail(pool, input.email.toLowerCase());
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const { passwordHash, ...publicUser } = user;
  return { user: publicUser, token: signToken(publicUser) };
}
