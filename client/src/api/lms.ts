export type Course = {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  priceCents: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourseStatus = 'draft' | 'published' | 'archived';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled';
  progressPercent: number;
  enrolledAt: string;
  completedAt: string | null;
};

export type Payment = {
  id: string;
  enrollmentId: string;
  userId: string;
  courseId: string;
  amountCents: number;
  provider: string;
  providerReference: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export type CohortReportRow = {
  cohortMonth: string;
  students: number;
  enrollments: number;
  paidStudents: number;
  revenueCents: number;
  completedEnrollments: number;
  completionRate: number;
  averageQuizScore: number;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'instructor' | 'student';
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  role?: AuthUser['role'];
};

export type CourseInput = {
  title: string;
  description: string;
  priceCents: number;
  status: CourseStatus;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type ApiRequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const { token, headers, ...requestOptions } = options ?? {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchCourses(input?: {
  status?: CourseStatus;
  limit?: number;
  offset?: number;
  token?: string;
}): Promise<{ courses: Course[] }> {
  const params = new URLSearchParams({
    limit: String(input?.limit ?? 50),
    offset: String(input?.offset ?? 0),
  });

  if (input?.status) {
    params.set('status', input.status);
  }

  return request(`/api/courses?${params.toString()}`, { token: input?.token });
}

export function fetchCourse(id: string): Promise<{ course: Course }> {
  return request(`/api/courses/${id}`);
}

export function login(input: { email: string; password: string }): Promise<AuthResult> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ role: 'student', ...input }),
  });
}

export function currentUser(token: string): Promise<{ user: AuthUser }> {
  return request('/api/auth/me', { token });
}

export function createCourse(input: CourseInput, token: string): Promise<{ course: Course }> {
  return request('/api/courses', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateCourse(id: string, input: Partial<CourseInput>, token: string): Promise<{ course: Course }> {
  return request(`/api/courses/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function fetchEnrollments(token: string): Promise<{ enrollments: Enrollment[] }> {
  return request('/api/courses/enrollments', { token });
}

export function enrollInCourse(courseId: string, token: string): Promise<{ enrollment: Enrollment }> {
  return request('/api/courses/enrollments', {
    method: 'POST',
    token,
    body: JSON.stringify({ courseId }),
  });
}

export function fetchPayments(token: string): Promise<{ payments: Payment[] }> {
  return request('/api/courses/payments', { token });
}

export function payForEnrollment(
  input: { enrollmentId: string; provider: string; providerReference: string },
  token: string,
): Promise<{ payment: Payment }> {
  return request('/api/courses/payments', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function fetchCohortReport(
  input: { from: string; to: string },
  token: string,
): Promise<{ report: CohortReportRow[] }> {
  const params = new URLSearchParams(input);
  return request(`/api/analytics/cohorts?${params.toString()}`, { token });
}
