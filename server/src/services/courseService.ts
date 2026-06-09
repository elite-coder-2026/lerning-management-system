import { pool } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import * as courses from '../repositories/courseRepository.js';
import * as enrollments from '../repositories/enrollmentRepository.js';
import * as payments from '../repositories/paymentRepository.js';
import type { Course, CourseStatus, Enrollment, Payment, VideoLesson } from '../types/models.js';

export function listCourses(input: { limit: number; offset: number; status?: CourseStatus }): Promise<Course[]> {
  return courses.listCourses(pool, input);
}

export function getCourse(id: string): Promise<Course | null> {
  return courses.findCourseById(pool, id);
}

export function createCourse(input: {
  instructorId: string;
  title: string;
  description: string;
  priceCents: number;
  status: CourseStatus;
}): Promise<Course> {
  return courses.createCourse(pool, input);
}

export function updateCourse(
  id: string,
  input: Partial<Pick<Course, 'title' | 'description' | 'priceCents' | 'status'>>,
): Promise<Course | null> {
  return courses.updateCourse(pool, id, input);
}

export function deleteCourse(id: string): Promise<boolean> {
  return courses.deleteCourse(pool, id);
}

export async function createVideoLesson(input: {
  courseId: string;
  instructorId: string;
  role: 'admin' | 'instructor';
  moduleTitle: string;
  title: string;
  summary: string;
  videoUrl: string;
  durationMinutes: number;
}): Promise<VideoLesson> {
  return withTransaction(async (client) => {
    const course = await courses.findCourseById(client, input.courseId);
    if (!course) {
      throw Object.assign(new Error('Course not found'), { statusCode: 404 });
    }

    if (input.role !== 'admin' && course.instructorId !== input.instructorId) {
      throw Object.assign(new Error('Course is not owned by this instructor'), { statusCode: 403 });
    }

    return courses.createVideoLesson(client, {
      courseId: input.courseId,
      moduleTitle: input.moduleTitle,
      title: input.title,
      summary: input.summary,
      videoUrl: input.videoUrl,
      durationSeconds: input.durationMinutes * 60,
    });
  });
}

export async function enrollStudent(input: { userId: string; courseId: string }): Promise<Enrollment> {
  return withTransaction(async (client) => {
    const course = await courses.findCourseById(client, input.courseId);
    if (!course || course.status !== 'published') {
      throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });
    }

    return enrollments.createEnrollment(client, input);
  });
}

export function listEnrollments(input: { role: 'admin' | 'instructor' | 'student'; userId: string }): Promise<Enrollment[]> {
  if (input.role === 'admin') {
    return enrollments.listEnrollments(pool);
  }

  return enrollments.listUserEnrollments(pool, input.userId);
}

export async function recordPayment(input: {
  enrollmentId: string;
  provider: string;
  providerReference: string;
}): Promise<Payment> {
  return withTransaction(async (client) => {
    const enrollment = await enrollments.findEnrollmentById(client, input.enrollmentId);
    if (!enrollment) {
      throw Object.assign(new Error('Enrollment not found'), { statusCode: 404 });
    }

    const course = await courses.findCourseById(client, enrollment.courseId);
    if (!course) {
      throw Object.assign(new Error('Course not found'), { statusCode: 404 });
    }

    return payments.createPayment(client, {
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      courseId: course.id,
      amountCents: course.priceCents,
      provider: input.provider,
      providerReference: input.providerReference,
      status: 'paid',
    });
  });
}

export function listPayments(input: { role: 'admin' | 'instructor' | 'student'; userId: string }): Promise<Payment[]> {
  if (input.role === 'admin') {
    return payments.listPayments(pool);
  }

  return payments.listPayments(pool, { userId: input.userId });
}
