import { env } from "~/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/server/db/schema";
import bcrypt from "bcryptjs";
import type { ExamQuestionData } from "~/app/data/data";

const conn = postgres(env.DATABASE_URL);
const db = drizzle(conn, { schema })

async function main() {
    console.log('Creating seed users...');
    const studentPassword = bcrypt.hashSync('123456', 10);

    const studentUser: typeof schema.users.$inferInsert = {
        id: 202512345,
        firstName: 'John',
        middleName: 'A',
        lastName: 'Doe',
        email: 'jdoe@up.edu.ph',
        role: 'student',
        passwordHash: studentPassword,
    };

    const studentDetails: typeof schema.students.$inferInsert = {
        id: studentUser.id,
        campus: 'UPTC',
        program: 'BS Computer Science',
    };

    const employeePassword = bcrypt.hashSync('123456', 10);

    const employeeUser: typeof schema.users.$inferInsert = {
        id: 202512346,
        firstName: 'Jane',
        middleName: 'B',
        lastName: 'Smith',
        email: 'jsmith@up.edu.ph',
        role: 'employee',
        passwordHash: employeePassword,
    };

    const employeeDetails: typeof schema.employees.$inferInsert = {
        id: employeeUser.id,
        campus: 'UPTC',
        division: 'DNSM',
    };

    const course1: typeof schema.courses.$inferInsert = {
        courseTitle: 'CMSC 135',
        courseDescription: 'Data Communication and Networking',
        academicYear: 'AY 2025 - 2026',
        semester: 'First Semester',
        courseEmployeeID: employeeUser.id,
    };

    const course1SectionL: typeof schema.courseSections.$inferInsert = {
        sectionName: 'L',
        courseCode: 'CMSC135-L',
        courseID: -1, // to be set after course insertion
    };

    const course1Exam1: typeof schema.exams.$inferInsert = {
        examTitle: 'Long Exam 1 Lecture',
        courseID: -1, // to be set after course insertion
        timeAllotted: '30 Minutes',
        dueDate: 'October 10, 2025',
    };

    const course1Exam1Assignment1: typeof schema.assignedExams.$inferInsert = {
        sectionID: -1, // to be set after section insertion
        examID: -1, // to be set after exam insertion
    };

    const course1Exam1Question1: typeof schema.examQuestions.$inferInsert = {
        examID: -1, // to be set after exam insertion
        points: 10,
        questionData: {
            type: 'multiple-choice',
            question: 'What does CPU stand for?',
            options: [
                'Central Processing Unit',
                'Computer Personal Unit',
                'Central Performance Unit',
                'Control Processing Unit'
            ],
        } as ExamQuestionData
    };

    const course1Exam1Question2: typeof schema.examQuestions.$inferInsert = {
        examID: -1, // to be set after exam insertion
        points: 15,
        questionData: {
            type: 'short-answer',
            question: 'Explain the concept of packet switching in data communication.',
        } as ExamQuestionData
    };

    const course1Exam1Question3: typeof schema.examQuestions.$inferInsert = {
        examID: -1, // to be set after exam insertion
        points: 15,
        questionData: {
            type: 'paragraph',
            question: 'Describe the OSI model and its seven layers.',
        } as ExamQuestionData
    };

    const course1Exam1Score1: typeof schema.examScores.$inferInsert = {
        examID: -1, // to be set after exam insertion
        sectionID: -1, // to be set after section insertion
        studentID: studentUser.id,
        score: 25,
    };

    const course1Exam1Answer1: typeof schema.examAnswers.$inferInsert = {
        examScoreID: -1, // to be set after exam insertion
        questionID: -1, // to be set after question insertion
        score: 10,
        answerData: {
            type: 'multiple-choice',
            selectedOption: 'Central Processing Unit',
        }
    };

    const course1Exam1Answer2: typeof schema.examAnswers.$inferInsert = {
        examScoreID: -1, // to be set after exam insertion
        questionID: -1, // to be set after question insertion
        score: 15,
        answerData: {
            type: 'short-answer',
            answer: 'Packet switching is a method of data transmission where data is broken into smaller packets that are sent independently over the network and reassembled at the destination.',
        }
    };

    const course1Exam1Answer3: typeof schema.examAnswers.$inferInsert = {
        examScoreID: -1, // to be set after exam insertion
        questionID: -1, // to be set after question insertion
        score: 0,
        answerData: {
            type: 'paragraph',
            answer: 'The OSI model is a conceptual framework used to understand and implement network protocols in seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.',
        }
    };

    console.log('Clearing existing users...');
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.examAnswers);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.examScores);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.examQuestions);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.assignedExams);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.exams);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.enrollments);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.courseSections);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.courses);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.students);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.employees);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await db.delete(schema.users);

    console.log('Seeding database with initial users...');
    await db.insert(schema.users).values([studentUser, employeeUser]);
    await db.insert(schema.students).values(studentDetails);
    await db.insert(schema.employees).values(employeeDetails);

    const course1Entry = await db.insert(schema.courses).values(course1).returning();
    course1SectionL.courseID = course1Entry[0]!.courseID;

    const course1SectionLEntry = await db.insert(schema.courseSections).values(course1SectionL).returning();

    const enrollment1: typeof schema.enrollments.$inferInsert = {
        studentID: studentUser.id,
        sectionID: course1SectionLEntry[0]!.sectionID,
    };

    await db.insert(schema.enrollments).values(enrollment1);

    course1Exam1.courseID = course1Entry[0]!.courseID;
    const course1Exam1Entry = await db.insert(schema.exams).values(course1Exam1).returning();

    course1Exam1Assignment1.sectionID = course1SectionLEntry[0]!.sectionID;
    course1Exam1Assignment1.examID = course1Exam1Entry[0]!.examID;

    await db.insert(schema.assignedExams).values(course1Exam1Assignment1);

    course1Exam1Question1.examID = course1Exam1Entry[0]!.examID;
    course1Exam1Question2.examID = course1Exam1Entry[0]!.examID;
    course1Exam1Question3.examID = course1Exam1Entry[0]!.examID;

    const course1Exam1Questions = await db.insert(schema.examQuestions).values([course1Exam1Question1, course1Exam1Question2, course1Exam1Question3]).returning();

    course1Exam1Score1.examID = course1Exam1Entry[0]!.examID;
    course1Exam1Score1.sectionID = course1SectionLEntry[0]!.sectionID;

    const course1Exam1Score1Entry = await db.insert(schema.examScores).values(course1Exam1Score1).returning();
    
    course1Exam1Answer1.examScoreID = course1Exam1Score1Entry[0]!.examScoreID;
    course1Exam1Answer1.questionID = course1Exam1Questions[0]!.questionID!;

    course1Exam1Answer2.examScoreID = course1Exam1Score1Entry[0]!.examScoreID;
    course1Exam1Answer2.questionID = course1Exam1Questions[1]!.questionID!;

    course1Exam1Answer3.examScoreID = course1Exam1Score1Entry[0]!.examScoreID;
    course1Exam1Answer3.questionID = course1Exam1Questions[2]!.questionID!;

    await db.insert(schema.examAnswers).values([course1Exam1Answer1, course1Exam1Answer2, course1Exam1Answer3]);
    await db.insert(schema.examAnswers).values([course1Exam1Answer1, course1Exam1Answer2, course1Exam1Answer3]);

    const seededUsers = await db.select().from(schema.users);
    console.log('Seeded Users:', seededUsers);

    console.log('Done');

    void conn.end();
}

void main();