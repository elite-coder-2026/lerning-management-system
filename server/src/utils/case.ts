export function mapUser(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    fullName: String(row.full_name),
    role: row.role as import('../types/models.js').Role,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function toNumber(value: unknown): number {
  return Number(value ?? 0);
}
