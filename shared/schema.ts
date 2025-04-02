import { pgTable, text, serial, integer, boolean, timestamp, json, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name"),
  iconColor: text("icon_color"),
  bgColor: text("bg_color"),
  textColor: text("text_color"),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  thumbnailUrl: text("thumbnail_url"),
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  categoryId: integer("category_id").notNull(),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(false),
  duration: integer("duration"), // in minutes
  resourceCount: integer("resource_count").default(0),
});

// Sections table for course modules/sections
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  courseId: integer("course_id").notNull(),
  order: integer("order").notNull(),
});

// Lessons table for individual lessons
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sectionId: integer("section_id").notNull(),
  order: integer("order").notNull(),
  videoUrl: text("video_url"),
  duration: integer("duration"), // in seconds
  isPreview: boolean("is_preview").default(false),
});

// Resources table for downloadable resources/notes
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  courseId: integer("course_id").notNull(),
  lessonId: integer("lesson_id"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"), // in bytes
});

// Enrollments table to track user's enrolled courses
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // Changed default from "active" to "pending"
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"), // Added payment method (upi, etc)
  paymentReference: text("payment_reference"), // For transaction ID or reference
  approvedBy: integer("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"), // When it was approved
});

// Progress table to track user's progress
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").default(false),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  lastWatched: timestamp("last_watched"),
});

// Payments table to track purchases
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  slug: true,
  iconName: true,
  iconColor: true,
  bgColor: true,
  textColor: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  slug: true,
  thumbnailUrl: true,
  price: true,
  salePrice: true,
  categoryId: true,
  isFeatured: true,
  isPublished: true,
  duration: true,
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  title: true,
  description: true,
  courseId: true,
  order: true,
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  title: true,
  description: true,
  sectionId: true,
  order: true,
  videoUrl: true,
  duration: true,
  isPreview: true,
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  courseId: true,
  lessonId: true,
  fileUrl: true,
  fileType: true,
  fileSize: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  userId: true,
  courseId: true,
  status: true,
  paymentId: true,
  paymentMethod: true,
  paymentReference: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).pick({
  userId: true,
  lessonId: true,
  completed: true,
  watchTimeSeconds: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  courseId: true,
  amount: true,
  currency: true,
  stripePaymentId: true,
  status: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Add specific schemas for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// CourseWithCategory with extended information
export type CourseWithCategory = Course & {
  category: Category;
};

// LessonWithProgress with user-specific information
export type LessonWithProgress = Lesson & {
  progress?: Progress;
};

// EnrollmentWithUserAndCourse with extended information
export type EnrollmentWithUserAndCourse = Enrollment & {
  user: User;
  course: Course;
};

// Admin dashboard schemas
export const uploadVideoSchema = z.object({
  lessonId: z.number(),
  video: z.instanceof(File),
});

export const uploadResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number(),
  lessonId: z.number().optional(),
  file: z.instanceof(File),
});

export type UploadVideoData = z.infer<typeof uploadVideoSchema>;
export type UploadResourceData = z.infer<typeof uploadResourceSchema>;
