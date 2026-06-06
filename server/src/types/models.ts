export type Role = 'admin' | 'instructor' | 'student';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Omit<User, 'passwordHash'>;

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

export type QuizSubmission = {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  gradePoints: number | null;
  feedback: string | null;
  gradedBy: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

export type DashboardAnalytics = {
  totalStudents: number;
  activeEnrollments: number;
  revenueCents: number;
  averageQuizScore: number;
  completionRate: number;
};
