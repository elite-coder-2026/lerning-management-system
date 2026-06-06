import type { Queryable } from '../types/db.js';
import type { PublicUser, Role, User } from '../types/models.js';
import { mapUser } from '../utils/case.js';
import { userQueries } from './query.js';

function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function createUser(
  db: Queryable,
  input: { email: string; passwordHash: string; fullName: string; role: Role },
): Promise<PublicUser> {
  const query = userQueries.createUser(input);
  const result = await db.query(query.text, query.values);

  return toPublicUser(mapUser(result.rows[0]!));
}

export async function findUserByEmail(db: Queryable, email: string): Promise<User | null> {
  const query = userQueries.findUserByEmail(email);
  const result = await db.query(query.text, query.values);

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserById(db: Queryable, id: string): Promise<PublicUser | null> {
  const query = userQueries.findUserById(id);
  const result = await db.query(query.text, query.values);

  return result.rows[0] ? toPublicUser(mapUser(result.rows[0])) : null;
}
