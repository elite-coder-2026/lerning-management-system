import { pool } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import * as courses from '../repositories/courseRepository.js';
import * as enrollments from '../repositories/enrollmentRepository.js';
import * as payments from '../repositories/paymentRepository.js';
import type { Course, CourseStatus, Enrollment, Payment } from '../types/models.js';

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

export async function enrollStudent(input: { userId: string; courseId: string }): Promise<Enrollment> {
  return withTransaction(async (client) => {
    const course = await courses.findCourseById(client, input.courseId);
    if (!course || course.status !== 'published') {
      throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });
    }

    return enrollments.createEnrollment(client, input);
  });
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
