import type { Queryable } from '../types/db.js';
import type { Payment, PaymentStatus } from '../types/models.js';
import { toNumber } from '../utils/case.js';
import { paymentQueries } from './query.js';

type PaymentRow = {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  amount_cents: number;
  provider: string;
  provider_reference: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
};

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    userId: row.user_id,
    courseId: row.course_id,
    amountCents: toNumber(row.amount_cents),
    provider: row.provider,
    providerReference: row.provider_reference,
    status: row.status,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createPayment(
  db: Queryable,
  input: {
    enrollmentId: string;
    userId: string;
    courseId: string;
    amountCents: number;
    provider: string;
    providerReference: string;
    status: PaymentStatus;
  },
): Promise<Payment> {
  const query = paymentQueries.createPayment(input);
  const result = await db.query<PaymentRow>(query.text, query.values);

  return mapPayment(result.rows[0]!);
}

export async function listPayments(db: Queryable, input?: { userId?: string }): Promise<Payment[]> {
  const query = paymentQueries.listPayments(input);
  const result = await db.query<PaymentRow>(query.text, query.values);

  return result.rows.map(mapPayment);
}
