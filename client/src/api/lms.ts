export type Course = {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  priceCents: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
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

export function fetchCourses(): Promise<{ courses: Course[] }> {
  return request('/api/courses?status=published&limit=12&offset=0');
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
