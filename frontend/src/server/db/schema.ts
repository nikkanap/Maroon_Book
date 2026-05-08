// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `maroon-book_${name}`);

export const users = createTable(
    "user",
    (d) => ({
        // Student Number or Employee Number
        id: d.integer().primaryKey().notNull().unique(),
        firstName: d.varchar({ length: 128 }).notNull(),
        middleName: d.varchar({ length: 128 }),
        lastName: d.varchar({ length: 128 }).notNull(),
        email: d.varchar({ length: 256 }).notNull().unique(),
        // BCrypt hashed password
        passwordHash: d.varchar({ length: 60 }).notNull(),
        role: d.varchar({ length: 32 }).notNull(),
    }),
    (t) => [index("id_idx").on(t.id)],
);

export const students = createTable(
    "student",
    (d) => ({
        id: d.integer().primaryKey().notNull().references(() => users.id),
        campus: d.varchar({ length: 128 }).notNull(),
        program: d.varchar({ length: 128 }).notNull(),
    }),
    (t) => [index("student_id_idx").on(t.id)],
);

export const employees = createTable(
    "employee",
    (d) => ({
        id: d.integer().primaryKey().notNull().references(() => users.id),
        campus: d.varchar({ length: 128 }).notNull(),
        division: d.varchar({ length: 128 }).notNull(),
    }),
    (t) => [index("employee_id_idx").on(t.id)],
);

export const courses = createTable(
    "course",
    (d) => ({
        courseID: d.serial().primaryKey().notNull(),
        courseTitle: d.varchar({ length: 256 }).notNull(),
        courseDescription: d.text().notNull(),
        academicYear: d.varchar({ length: 14 }).notNull(),
        semester: d.varchar({ length: 16 }).notNull(),
        courseEmployeeID: d.integer().notNull().references(() => employees.id),
    }),
    (t) => [index("course_id_idx").on(t.courseID)],
);

export const courseRelationships = relations(courses, ({ one, many }) => ({
    employee: one(employees, { fields: [courses.courseEmployeeID], references: [employees.id] }),
    sections: many(courseSections),
}));

export const courseSections = createTable(
    "course_section",
    (d) => ({
        sectionID: d.serial().primaryKey().notNull(),
        sectionName: d.varchar({ length: 4 }).notNull(),
        courseCode: d.varchar({ length: 64 }).notNull().unique(),
        courseID: d.integer().notNull().references(() => courses.courseID),
    }),
    (t) => [index("section_id_idx").on(t.sectionID)],
);

export const courseSectionRelations = relations(courseSections, ({ one, many }) => ({
    course: one(courses, { fields: [courseSections.courseID], references: [courses.courseID] }),
    enrollments: many(enrollments),
    exams: many(assignedExams),
}));

export const enrollments = createTable(
    "enrollment",
    (d) => ({
        enrollmentID: d.serial().primaryKey().notNull(),
        studentID: d.integer().notNull().references(() => students.id),
        sectionID: d.integer().notNull().references(() => courseSections.sectionID),
    }),
    (t) => [index("enrollment_id_idx").on(t.enrollmentID)],
);

export const enrollmentRelations = relations(enrollments, ({ one }) => ({
    student: one(students, { fields: [enrollments.studentID], references: [students.id] }),
    section: one(courseSections, { fields: [enrollments.sectionID], references: [courseSections.sectionID] }),
}));

export const exams = createTable(
    "exam",
    (d) => ({
        examID: d.serial().primaryKey().notNull(),
        courseID: d.integer().notNull().references(() => courses.courseID),
        examTitle: d.varchar({ length: 256 }).notNull(),
        timeAllotted: d.varchar({ length: 16 }).notNull(),
        dueDate: d.varchar({ length: 256 }).notNull(),
    }),
    (t) => [index("exam_id_idx").on(t.examID)],
);

export const examRelations = relations(exams, ({ one, many }) => ({
    assigned: many(assignedExams),
    questions: many(examQuestions),
    scores: many(examScores),
    course: one(courses, { fields: [exams.courseID], references: [courses.courseID] }),
}));

export const examQuestions = createTable(
    "exam_question",
    (d) => ({
        questionID: d.serial().primaryKey().notNull(),
        examID: d.integer().notNull().references(() => exams.examID),
        questionData: d.jsonb().notNull(),
        points: d.integer().notNull(),
    }),
    (t) => [index("question_id_idx").on(t.questionID)],
);

export const examQuestionRelations = relations(examQuestions, ({ one }) => ({
    exam: one(exams, { fields: [examQuestions.examID], references: [exams.examID] }),
}));    

export const assignedExams = createTable(
    "assigned_exam",
    (d) => ({
        assignedExamID: d.serial().primaryKey().notNull(),
        examID: d.integer().notNull().references(() => exams.examID),
        sectionID: d.integer().notNull().references(() => courseSections.sectionID),
    }),
    (t) => [index("assigned_exam_id_idx").on(t.assignedExamID)],
);

export const assignedExamRelations = relations(assignedExams, ({ one }) => ({
    exam: one(exams, { fields: [assignedExams.examID], references: [exams.examID] }),
    section: one(courseSections, { fields: [assignedExams.sectionID], references: [courseSections.sectionID] }),
}));

export const examScores = createTable(
    "exam_score",
    (d) => ({
        examScoreID: d.serial().primaryKey().notNull(),
        examID: d.integer().notNull().references(() => exams.examID),
        sectionID: d.integer().notNull().references(() => courseSections.sectionID),
        studentID: d.integer().notNull().references(() => students.id),
        score: d.integer().notNull(),
    }),
    (t) => [index("exam_score_id_idx").on(t.examScoreID)],
);

export const examScoreRelations = relations(examScores, ({ one, many }) => ({
    exam: one(exams, { fields: [examScores.examID], references: [exams.examID] }),
    section: one(courseSections, { fields: [examScores.sectionID], references: [courseSections.sectionID] }),
    student: one(students, { fields: [examScores.studentID], references: [students.id] }),
    answers: many(examAnswers),
}));

export const examAnswers = createTable(
    "exam_answer",
    (d) => ({
        examAnswerID: d.serial().primaryKey().notNull(),
        examScoreID: d.integer().notNull().references(() => examScores.examScoreID),
        questionID: d.integer().notNull().references(() => examQuestions.questionID),
        answerData: d.jsonb().notNull(),
        score: d.integer().notNull(),
    }),
    (t) => [index("exam_answer_id_idx").on(t.examAnswerID)],
);

export const examAnswerRelations = relations(examAnswers, ({ one }) => ({
    examScore: one(examScores, { fields: [examAnswers.examScoreID], references: [examScores.examScoreID] }),
    question: one(examQuestions, { fields: [examAnswers.questionID], references: [examQuestions.questionID] }),
}));
