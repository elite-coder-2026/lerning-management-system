-- Advanced LMS analytics queries using CTEs.
-- Run individual queries against the lms database.

-- 1. Basic: user counts by role.
WITH role_counts AS (
  SELECT
    role,
    COUNT(*)::integer AS total_users
  FROM users
  GROUP BY role
)
SELECT
  role,
  total_users
FROM role_counts
ORDER BY total_users DESC, role;


-- 2. Basic: published course catalog summary.
WITH published_courses AS (
  SELECT
    id,
    instructor_id,
    title,
    price_cents,
    created_at
  FROM courses
  WHERE status = 'published'
)
SELECT
  COUNT(*)::integer AS published_course_count,
  COALESCE(AVG(price_cents), 0)::integer AS average_price_cents,
  COALESCE(MIN(price_cents), 0)::integer AS lowest_price_cents,
  COALESCE(MAX(price_cents), 0)::integer AS highest_price_cents
FROM published_courses;


-- 3. Basic: enrollment counts per course.
WITH course_enrollments AS (
  SELECT
    course_id,
    COUNT(*)::integer AS total_enrollments,
    COUNT(*) FILTER (WHERE status = 'active')::integer AS active_enrollments,
    COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed_enrollments
  FROM enrollments
  GROUP BY course_id
)
SELECT
  c.id AS course_id,
  c.title,
  COALESCE(ce.total_enrollments, 0) AS total_enrollments,
  COALESCE(ce.active_enrollments, 0) AS active_enrollments,
  COALESCE(ce.completed_enrollments, 0) AS completed_enrollments
FROM courses c
LEFT JOIN course_enrollments ce ON ce.course_id = c.id
ORDER BY total_enrollments DESC, c.title;


-- 4. Intermediate: monthly revenue from paid payments.
WITH paid_payments AS (
  SELECT
    date_trunc('month', paid_at)::date AS revenue_month,
    amount_cents
  FROM payments
  WHERE status = 'paid'
    AND paid_at IS NOT NULL
),
monthly_revenue AS (
  SELECT
    revenue_month,
    SUM(amount_cents)::integer AS revenue_cents,
    COUNT(*)::integer AS payment_count
  FROM paid_payments
  GROUP BY revenue_month
)
SELECT
  revenue_month,
  revenue_cents,
  payment_count
FROM monthly_revenue
ORDER BY revenue_month DESC;


-- 5. Intermediate: instructor revenue leaderboard.
WITH paid_course_revenue AS (
  SELECT
    p.course_id,
    SUM(p.amount_cents)::integer AS revenue_cents,
    COUNT(*)::integer AS paid_enrollments
  FROM payments p
  WHERE p.status = 'paid'
  GROUP BY p.course_id
),
instructor_totals AS (
  SELECT
    c.instructor_id,
    COUNT(c.id)::integer AS course_count,
    COALESCE(SUM(pcr.revenue_cents), 0)::integer AS revenue_cents,
    COALESCE(SUM(pcr.paid_enrollments), 0)::integer AS paid_enrollments
  FROM courses c
  LEFT JOIN paid_course_revenue pcr ON pcr.course_id = c.id
  GROUP BY c.instructor_id
)
SELECT
  u.id AS instructor_id,
  u.full_name AS instructor_name,
  it.course_count,
  it.paid_enrollments,
  it.revenue_cents
FROM instructor_totals it
JOIN users u ON u.id = it.instructor_id
ORDER BY it.revenue_cents DESC, it.paid_enrollments DESC;


-- 6. Intermediate: quiz performance by course.
WITH quiz_attempts AS (
  SELECT
    q.course_id,
    qs.quiz_id,
    qs.user_id,
    qs.score,
    qs.passed
  FROM quiz_submissions qs
  JOIN quizzes q ON q.id = qs.quiz_id
),
course_quiz_stats AS (
  SELECT
    course_id,
    COUNT(*)::integer AS total_attempts,
    COUNT(DISTINCT user_id)::integer AS unique_students,
    COALESCE(AVG(score), 0)::numeric(5,2) AS average_score,
    COALESCE(COUNT(*) FILTER (WHERE passed)::numeric / NULLIF(COUNT(*), 0) * 100, 0)::numeric(5,2) AS pass_rate
  FROM quiz_attempts
  GROUP BY course_id
)
SELECT
  c.id AS course_id,
  c.title,
  COALESCE(cqs.total_attempts, 0) AS total_attempts,
  COALESCE(cqs.unique_students, 0) AS unique_students,
  COALESCE(cqs.average_score, 0) AS average_score,
  COALESCE(cqs.pass_rate, 0) AS pass_rate
FROM courses c
LEFT JOIN course_quiz_stats cqs ON cqs.course_id = c.id
ORDER BY pass_rate DESC, average_score DESC;


-- 7. Intermediate: students at risk by progress and quiz score.
WITH active_students AS (
  SELECT
    e.user_id,
    e.course_id,
    e.progress_percent
  FROM enrollments e
  WHERE e.status = 'active'
),
student_quiz_average AS (
  SELECT
    qs.user_id,
    q.course_id,
    AVG(qs.score)::numeric(5,2) AS average_quiz_score
  FROM quiz_submissions qs
  JOIN quizzes q ON q.id = qs.quiz_id
  GROUP BY qs.user_id, q.course_id
),
risk_scores AS (
  SELECT
    ast.user_id,
    ast.course_id,
    ast.progress_percent,
    COALESCE(sqa.average_quiz_score, 0) AS average_quiz_score,
    CASE
      WHEN ast.progress_percent < 25 AND COALESCE(sqa.average_quiz_score, 0) < 60 THEN 'high'
      WHEN ast.progress_percent < 50 OR COALESCE(sqa.average_quiz_score, 0) < 70 THEN 'medium'
      ELSE 'low'
    END AS risk_level
  FROM active_students ast
  LEFT JOIN student_quiz_average sqa
    ON sqa.user_id = ast.user_id
   AND sqa.course_id = ast.course_id
)
SELECT
  u.full_name AS student_name,
  u.email,
  c.title AS course_title,
  rs.progress_percent,
  rs.average_quiz_score,
  rs.risk_level
FROM risk_scores rs
JOIN users u ON u.id = rs.user_id
JOIN courses c ON c.id = rs.course_id
ORDER BY
  CASE rs.risk_level
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  rs.progress_percent ASC;


-- 8. Advanced: course funnel from enrollment to completion, payment, quiz pass, and assignment grading.
WITH enrollment_base AS (
  SELECT
    e.id AS enrollment_id,
    e.user_id,
    e.course_id,
    e.status,
    e.progress_percent
  FROM enrollments e
),
paid_users AS (
  SELECT DISTINCT
    user_id,
    course_id
  FROM payments
  WHERE status = 'paid'
),
quiz_pass_users AS (
  SELECT DISTINCT
    qs.user_id,
    q.course_id
  FROM quiz_submissions qs
  JOIN quizzes q ON q.id = qs.quiz_id
  WHERE qs.passed = true
),
graded_assignment_users AS (
  SELECT DISTINCT
    s.user_id,
    a.course_id
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE s.graded_at IS NOT NULL
),
course_funnel AS (
  SELECT
    eb.course_id,
    COUNT(*)::integer AS enrolled_students,
    COUNT(*) FILTER (WHERE pu.user_id IS NOT NULL)::integer AS paid_students,
    COUNT(*) FILTER (WHERE eb.status = 'completed')::integer AS completed_students,
    COUNT(*) FILTER (WHERE qpu.user_id IS NOT NULL)::integer AS quiz_passed_students,
    COUNT(*) FILTER (WHERE gau.user_id IS NOT NULL)::integer AS graded_assignment_students
  FROM enrollment_base eb
  LEFT JOIN paid_users pu
    ON pu.user_id = eb.user_id
   AND pu.course_id = eb.course_id
  LEFT JOIN quiz_pass_users qpu
    ON qpu.user_id = eb.user_id
   AND qpu.course_id = eb.course_id
  LEFT JOIN graded_assignment_users gau
    ON gau.user_id = eb.user_id
   AND gau.course_id = eb.course_id
  GROUP BY eb.course_id
)
SELECT
  c.id AS course_id,
  c.title,
  cf.enrolled_students,
  cf.paid_students,
  cf.completed_students,
  cf.quiz_passed_students,
  cf.graded_assignment_students,
  COALESCE(cf.completed_students::numeric / NULLIF(cf.enrolled_students, 0) * 100, 0)::numeric(5,2) AS completion_rate,
  COALESCE(cf.paid_students::numeric / NULLIF(cf.enrolled_students, 0) * 100, 0)::numeric(5,2) AS paid_conversion_rate
FROM course_funnel cf
JOIN courses c ON c.id = cf.course_id
ORDER BY cf.enrolled_students DESC, completion_rate DESC;


-- 9. Advanced: rolling 30-day revenue and enrollment analytics.
WITH daily_series AS (
  SELECT generate_series(
    current_date - interval '29 days',
    current_date,
    interval '1 day'
  )::date AS day
),
daily_revenue AS (
  SELECT
    paid_at::date AS day,
    SUM(amount_cents)::integer AS revenue_cents
  FROM payments
  WHERE status = 'paid'
    AND paid_at >= current_date - interval '29 days'
  GROUP BY paid_at::date
),
daily_enrollments AS (
  SELECT
    enrolled_at::date AS day,
    COUNT(*)::integer AS enrollments
  FROM enrollments
  WHERE enrolled_at >= current_date - interval '29 days'
  GROUP BY enrolled_at::date
),
daily_metrics AS (
  SELECT
    ds.day,
    COALESCE(dr.revenue_cents, 0) AS revenue_cents,
    COALESCE(de.enrollments, 0) AS enrollments
  FROM daily_series ds
  LEFT JOIN daily_revenue dr ON dr.day = ds.day
  LEFT JOIN daily_enrollments de ON de.day = ds.day
)
SELECT
  day,
  revenue_cents,
  enrollments,
  SUM(revenue_cents) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::integer AS trailing_7_day_revenue_cents,
  SUM(enrollments) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::integer AS trailing_7_day_enrollments
FROM daily_metrics
ORDER BY day;


-- 10. Advanced: ranked course performance report for a date range.
-- Replace the two values in params with the reporting window you want.
WITH params AS (
  SELECT
    '2026-01-01'::timestamptz AS report_start,
    '2027-01-01'::timestamptz AS report_end
),
enrollment_metrics AS (
  SELECT
    e.course_id,
    COUNT(*)::integer AS enrollments,
    COUNT(*) FILTER (WHERE e.status = 'completed')::integer AS completions,
    AVG(e.progress_percent)::numeric(5,2) AS average_progress
  FROM enrollments e
  CROSS JOIN params p
  WHERE e.enrolled_at >= p.report_start
    AND e.enrolled_at < p.report_end
  GROUP BY e.course_id
),
revenue_metrics AS (
  SELECT
    pmt.course_id,
    SUM(pmt.amount_cents)::integer AS revenue_cents,
    COUNT(*)::integer AS paid_count
  FROM payments pmt
  CROSS JOIN params p
  WHERE pmt.status = 'paid'
    AND pmt.created_at >= p.report_start
    AND pmt.created_at < p.report_end
  GROUP BY pmt.course_id
),
quiz_metrics AS (
  SELECT
    q.course_id,
    AVG(qs.score)::numeric(5,2) AS average_quiz_score,
    COUNT(*) FILTER (WHERE qs.passed)::integer AS passed_quizzes,
    COUNT(*)::integer AS quiz_attempts
  FROM quiz_submissions qs
  JOIN quizzes q ON q.id = qs.quiz_id
  CROSS JOIN params p
  WHERE qs.submitted_at >= p.report_start
    AND qs.submitted_at < p.report_end
  GROUP BY q.course_id
),
assignment_metrics AS (
  SELECT
    a.course_id,
    COUNT(*) FILTER (WHERE s.graded_at IS NOT NULL)::integer AS graded_submissions,
    AVG(s.grade_points)::numeric(8,2) AS average_assignment_points
  FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  CROSS JOIN params p
  WHERE s.submitted_at >= p.report_start
    AND s.submitted_at < p.report_end
  GROUP BY a.course_id
),
course_scores AS (
  SELECT
    c.id AS course_id,
    c.title,
    COALESCE(em.enrollments, 0) AS enrollments,
    COALESCE(em.completions, 0) AS completions,
    COALESCE(em.average_progress, 0) AS average_progress,
    COALESCE(rm.revenue_cents, 0) AS revenue_cents,
    COALESCE(rm.paid_count, 0) AS paid_count,
    COALESCE(qm.average_quiz_score, 0) AS average_quiz_score,
    COALESCE(qm.passed_quizzes, 0) AS passed_quizzes,
    COALESCE(qm.quiz_attempts, 0) AS quiz_attempts,
    COALESCE(am.graded_submissions, 0) AS graded_submissions,
    COALESCE(am.average_assignment_points, 0) AS average_assignment_points
  FROM courses c
  LEFT JOIN enrollment_metrics em ON em.course_id = c.id
  LEFT JOIN revenue_metrics rm ON rm.course_id = c.id
  LEFT JOIN quiz_metrics qm ON qm.course_id = c.id
  LEFT JOIN assignment_metrics am ON am.course_id = c.id
)
SELECT
  course_id,
  title,
  enrollments,
  completions,
  average_progress,
  revenue_cents,
  paid_count,
  average_quiz_score,
  passed_quizzes,
  quiz_attempts,
  graded_submissions,
  average_assignment_points,
  DENSE_RANK() OVER (ORDER BY revenue_cents DESC, enrollments DESC, average_quiz_score DESC) AS performance_rank
FROM course_scores
ORDER BY performance_rank, title;
