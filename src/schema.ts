import { pgTable, serial, varchar, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. 学生テーブル
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

// 2. 授業テーブル
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
});

// 3. 中間テーブル（履修登録）
// 学生IDと授業IDの複合主キーを設定し、データ整合性を担保します
export const enrollments = pgTable("enrollments", {
  studentId: integer("student_id").references(() => students.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.studentId, t.courseId] }),
}));

// --- Relational Queries用のリレーション定義 ---
export const studentsRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
}));
export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
}));
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));
