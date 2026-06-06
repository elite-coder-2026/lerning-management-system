import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }

  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode: number }).statusCode)
      : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';

  return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ error: message });
}
