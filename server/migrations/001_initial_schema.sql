BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, sort_order)
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, sort_order)
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, course_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  provider text NOT NULL,
  provider_reference text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_reference)
);

CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score numeric(5,2) NOT NULL CHECK (passing_score >= 0 AND passing_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  sort_order integer NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  UNIQUE (quiz_id, sort_order)
);

CREATE TABLE quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false
);

CREATE TABLE quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id uuid NOT NULL REFERENCES quiz_options(id) ON DELETE RESTRICT,
  is_correct boolean NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  UNIQUE (submission_id, question_id)
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL,
  max_points integer NOT NULL CHECK (max_points > 0),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  grade_points integer CHECK (grade_points >= 0),
  feedback text,
  graded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_status_created_at ON courses(status, created_at DESC);
CREATE INDEX idx_modules_course_sort ON modules(course_id, sort_order);
CREATE INDEX idx_lessons_module_sort ON lessons(module_id, sort_order);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_payments_user_created_at ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_course_status ON payments(course_id, status);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_sort ON quiz_questions(quiz_id, sort_order);
CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX idx_quiz_submissions_quiz_user ON quiz_submissions(quiz_id, user_id, submitted_at DESC);
CREATE INDEX idx_quiz_answers_submission_id ON quiz_answers(submission_id);
CREATE INDEX idx_assignments_course_due ON assignments(course_id, due_at);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user ON assignment_submissions(user_id);

COMMIT;
