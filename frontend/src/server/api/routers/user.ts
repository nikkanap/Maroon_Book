import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { assignedExams, courseSections, courses, employees, enrollments, examQuestions, exams, students, users, examScores, examAnswers } from "~/server/db/schema";
import type { Course, UserExamData } from "~/app/data/data";

const JWT_SECRET = 'maroon-book-jwt-secret';
const NOTIFY_HASH_SALT = 'maroon-book-salt';

function generateAuthToken(userId: number, role: string): string {
    return jwt.sign({
        id: userId,
        role,
    }, JWT_SECRET);
}

function generateNotifyToken(userId: number, role: string): {
    signature: string;
    nonce: string;
} {
    const nonce = Date.now().toString() + '-' + userId;
    const signature = crypto.createHash('sha256')
        .update(NOTIFY_HASH_SALT + userId + role + nonce)
        .digest('hex');

    return {
        signature,
        nonce,
    };
}

function wrapSuccess<T>(data: T): {
    status: 'ok';
    data: T;
} {
    return {
        status: 'ok',
        data,
    };
}

function wrapError(message: string): {
    status: 'error';
    message: string;
} {
    return {
        status: 'error',
        message,
    };
}

export const userRouter = createTRPCRouter({
    loginStudent: publicProcedure
        .input(z.object({
            id: z.number().int().positive(),
            // Bad practice, but this is just a
            // demo app
            password: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.query.users.findFirst({
                where: (users, { and, eq }) => and(
                    eq(users.id, input.id),
                    eq(users.role, 'student'),
                ),
            });

            const userDetails = await ctx.db.query.students.findFirst({
                where: (students, { eq }) => eq(students.id, input.id),
            });

            if (!user) {
                return wrapError('User not found');
            }

            // Check password via BCrypt
            const validPassword = await bcrypt.compare(input.password, user.passwordHash);

            if (!validPassword) {
                return wrapError('Invalid password');
            }

            return wrapSuccess({
                id: user.id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,

                // JWT for API Authentication
                authToken: generateAuthToken(user.id, user.role),

                // Credentials for Notification Web Socket Server
                notify: generateNotifyToken(user.id, user.role),

                details: {
                    campus: userDetails?.campus ?? '',
                    program: userDetails?.program ?? '',
                },
            });
        }),

    loginEmployee: publicProcedure
        .input(z.object({
            id: z.number().int().positive(),
            // Bad practice, but this is just a
            // demo app
            password: z.string().min(1),
        }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.query.users.findFirst({
                where: (users, { and, eq }) => and(
                    eq(users.id, input.id),
                    eq(users.role, 'employee'),
                ),
            });

            const userDetails = await ctx.db.query.employees.findFirst({
                where: (employees, { eq }) => eq(employees.id, input.id),
            });

            if (!user) {
                return wrapError('User not found');
            }

            // Check password via BCrypt
            const validPassword = await bcrypt.compare(input.password, user.passwordHash);

            if (!validPassword) {
                return wrapError('Invalid password');
            }

            return wrapSuccess({
                id: user.id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,

                // JWT for API Authentication
                authToken: generateAuthToken(user.id, user.role),

                // Credentials for Notification Web Socket Server
                notify: generateNotifyToken(user.id, user.role),

                details: {
                    campus: userDetails?.campus ?? '',
                    division: userDetails?.division ?? '',
                },
            });
        }),

    getNotifyToken: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .query(async ({ input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                return wrapSuccess(generateNotifyToken(id, role));
            } catch {
                return wrapError('Invalid auth token');
            }
        }),
    
    register: publicProcedure
        .input(z.object({
            id: z.number().int().positive(),
            firstName: z.string().min(1),
            middleName: z.string().optional(),
            lastName: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(6),
            role: z.enum(['employee', 'student']),
            campus: z.string().min(1),
            programOrDivision: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const existingUserById = await ctx.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, input.id),
            });

            if (existingUserById) {
                return wrapError('User ID already exists');
            }

            const existingUserByEmail = await ctx.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, input.email),
            });

            if (existingUserByEmail) {
                return wrapError('Email already registered');
            }

            const passwordHash = await bcrypt.hash(input.password, 10);

            await ctx.db.insert(users).values({
                id: input.id,
                firstName: input.firstName,
                middleName: input.middleName,
                lastName: input.lastName,
                email: input.email,
                passwordHash,
                role: input.role,
            });

            // @ts-expect-error: This is fine, we will always set details based on role
            let details: {
                campus: string;
                division: string;
            } | {
                campus: string;
                program: string;
            } = {};
            if (input.role === 'student') {
                await ctx.db.insert(students).values({
                    id: input.id,
                    campus: input.campus,
                    program: input.programOrDivision,
                });

                details = {
                    campus: input.campus,
                    program: input.programOrDivision,
                };
            } else if (input.role === 'employee') {
                await ctx.db.insert(employees).values({
                    id: input.id,
                    campus: input.campus,
                    division: input.programOrDivision,
                });

                details = {
                    campus: input.campus,
                    division: input.programOrDivision,
                };
            }

            return wrapSuccess({
                id: input.id,
                firstName: input.firstName,
                middleName: input.middleName,
                lastName: input.lastName,
                email: input.email,

                // JWT for API Authentication
                authToken: generateAuthToken(input.id, input.role),

                // Credentials for Notification Web Socket Server
                notify: generateNotifyToken(input.id, input.role),

                details,
            });
        }),
    
    // Employee
    getEmployeeCourses: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'employee') {
                    return wrapError('User is not an employee');
                }

                const coursesTaught = await ctx.db.query.courses.findMany({
                    where: (courses, { eq }) => eq(courses.courseEmployeeID, id),
                    with: {
                        sections: {
                            with: {
                                enrollments: true,
                            }
                        }
                    }
                });

                for (const course of coursesTaught) {
                    for (const section of course.sections) {
                        // @ts-expect-error: This is fine, we will always set studentsEnrolled to a number[]
                        section.studentsEnrolled = section.enrollments.map(enrollment => enrollment.studentID);
                    }
                }

                return wrapSuccess(coursesTaught as unknown as Course[]);
            } catch {
                return wrapError('Invalid auth token');
            }
        }),
    
    getEmployeeExams: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'employee') {
                    return wrapError('User is not an employee');
                }

                const courses = await ctx.db.query.courses.findMany({
                    where: (courses, { eq }) => eq(courses.courseEmployeeID, id),
                    with: {
                        sections: {
                            with: {
                                exams: {
                                    with: {
                                        exam: {
                                            with: {
                                                questions: true,
                                                scores: true,
                                                assigned: true,
                                            }
                                        },
                                    }
                                },
                            }
                        }
                    }
                });

                const exams = courses.flatMap(course => 
                    course.sections.flatMap(section => 
                        section.exams.flatMap(assignedExam => assignedExam.exam)
                    )
                );

                return wrapSuccess(exams as UserExamData[]);
            } catch {
                return wrapError('Invalid auth token');
            }
        }),
    
    createExam: publicProcedure
        .input(z.object({
            token: z.string(),
            exam: z.object({
                examTitle: z.string().min(1),
                timeAllotted: z.string().min(1),
                dueDate: z.string().min(1),
                courseID: z.number().int().positive(),
                assigned: z.array(z.object({
                    sectionID: z.number().int().positive(),
                })),
                questions: z.array(z.object({
                    points: z.number().int().positive(),
                    questionData: z.union([
                        z.object({
                            type: z.literal('multiple-choice'),
                            question: z.string().min(1),
                            options: z.array(z.string().min(1)).length(4),
                        }),
                        z.object({
                            type: z.literal('short-answer'),
                            question: z.string().min(1),
                            wordLimit: z.number().int().positive().optional(),
                        }),
                        z.object({
                            type: z.literal('paragraph'),
                            question: z.string().min(1),
                            wordLimit: z.number().int().positive().optional(),
                        }),
                    ]),
                })),
            }),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'employee') {
                    return wrapError('User is not an employee');
                }

                const targetCourse = await ctx.db.query.courses.findFirst({
                    where: (courses, { and, eq }) => and(
                        eq(courses.courseID, input.exam.courseID),
                        eq(courses.courseEmployeeID, id),
                    ),
                });

                if (!targetCourse) {
                    return wrapError('Course not found or user is not the instructor for the course');
                }

                let success = false;

                let examEntry: { examID: number }[] = [];

                await ctx.db.transaction(async (tx) => {
                    examEntry = await tx.insert(exams).values({
                        courseID: input.exam.courseID,
                        examTitle: input.exam.examTitle,
                        timeAllotted: input.exam.timeAllotted,
                        dueDate: input.exam.dueDate,
                    }).returning();

                    if (examEntry.length === 0) {
                        tx.rollback();
                        return;
                    }

                    for (const assigned of input.exam.assigned) {
                        await tx.insert(assignedExams).values({
                            examID: examEntry[0]!.examID,
                            sectionID: assigned.sectionID,
                        });
                    }

                    for (const question of input.exam.questions) {
                        await tx.insert(examQuestions).values({
                            examID: examEntry[0]!.examID,
                            points: question.points,
                            questionData: question.questionData,
                        });
                    }

                    success = true;
                });

                if (success) {
                    // Get all students enrolled in the assigned sections
                    const sectionIDs = input.exam.assigned.map(a => a.sectionID);
                    let studentEnrollments: typeof enrollments.$inferSelect[] = [];
                    
                    if (sectionIDs.length > 0) {
                        if (sectionIDs.length === 1) {
                            studentEnrollments = await ctx.db.query.enrollments.findMany({
                                where: (enrollments, { eq }) => eq(enrollments.sectionID, sectionIDs[0]!),
                            });
                        } else {
                            studentEnrollments = await ctx.db.query.enrollments.findMany({
                                where: (enrollments, { or, eq }) => 
                                    or(...sectionIDs.map(sectionID => eq(enrollments.sectionID, sectionID))),
                            });
                        }
                    }

                    // Get unique student IDs
                    const studentIDs = [...new Set(studentEnrollments.map(e => e.studentID))];

                    // Send notifications to enrolled students
                    if (studentIDs.length > 0) {
                        try {
                            const notificationData = {
                                message: `A new exam "${input.exam.examTitle}" has been added to your course.`,
                                examTitle: input.exam.examTitle,
                                examID: examEntry[0]!.examID,
                                courseID: input.exam.courseID,
                                dueDate: input.exam.dueDate,
                            };

                            const response = await fetch('http://localhost:3001/api/notify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    userIds: studentIDs,
                                    data: notificationData,
                                }),
                            });

                            if (!response.ok) {
                                console.error('Failed to send notifications:', await response.text());
                            } else {
                                console.log(`Sent exam notification to ${studentIDs.length} student(s)`);
                            }
                        } catch (error) {
                            // Don't fail exam creation if notification fails
                            console.error('Error sending notifications:', error);
                        }
                    }

                    return wrapSuccess({});
                } else {
                    return wrapError('Failed to create exam');
                }
            } catch {
                return wrapError('Invalid auth token');
            }
        }),

    // Student
    getStudentCourses: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'student') {
                    return wrapError('User is not a student');
                }

                const enrollments = await ctx.db.query.enrollments.findMany({
                    where: (enrollments, { eq }) => eq(enrollments.studentID, id),
                    with: {
                        section: {
                            with: {
                                course: {
                                    with: {
                                        sections: {
                                            with: {
                                                enrollments: true,
                                            },
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                const coursesEnrolled = enrollments.map(enrollment => enrollment.section.course);

                for (const course of coursesEnrolled) {
                    for (const section of course.sections) {
                        // @ts-expect-error: This is fine, we will always set studentsEnrolled to a number[]
                        section.studentsEnrolled = section.enrollments.map(enrollment => enrollment.studentID);
                    }

                    course.sections = course.sections.filter(section => 
                        section.enrollments.some(enrollment => enrollment.studentID === id)
                    );
                }

                return wrapSuccess(coursesEnrolled as unknown as Course[]);
            } catch {
                return wrapError('Invalid auth token');
            }
        }),
    
    getStudentExams: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'student') {
                    return wrapError('User is not a student');
                }

                const enrollments = await ctx.db.query.enrollments.findMany({
                    where: (enrollments, { eq }) => eq(enrollments.studentID, id),
                    with: {
                        section: {
                            with: {
                                course: {
                                    with: {
                                        sections: {
                                            with: {
                                                exams: {
                                                    with: {
                                                        exam: {
                                                            with: {
                                                                questions: true,
                                                                scores: {
                                                                    where: (scores, { eq }) => eq(scores.studentID, id),
                                                                },
                                                                assigned: true,
                                                            }
                                                        },
                                                    }
                                                },
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                const exams = enrollments.flatMap(enrollment => 
                    enrollment.section.course.sections.flatMap(section => 
                        section.exams.flatMap(assignedExam => assignedExam.exam)
                    )
                );

                return wrapSuccess(exams as UserExamData[]);
            } catch {
                return wrapError('Invalid auth token');
            }
        }),

    createCourse: publicProcedure
        .input(z.object({
            token: z.string(),
            course: z.object({
                courseTitle: z.string().min(1),
                courseDescription: z.string().min(1),
                academicYear: z.string().min(1),
                semester: z.string().min(1),
                sections: z.array(z.object({
                    sectionName: z.string().min(1).max(4),
                    courseCode: z.string().min(1).max(64),
                })).min(1),
            }),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'employee') {
                    return wrapError('User is not an employee');
                }

                // Check if any course code already exists
                const courseCodes = input.course.sections.map(s => s.courseCode);
                let existingSections: typeof courseSections.$inferSelect[] = [];
                
                if (courseCodes.length === 1) {
                    existingSections = await ctx.db.query.courseSections.findMany({
                        where: (sections, { eq }) => eq(sections.courseCode, courseCodes[0]!),
                    });
                } else if (courseCodes.length > 1) {
                    existingSections = await ctx.db.query.courseSections.findMany({
                        where: (sections, { or, eq }) => 
                            or(...courseCodes.map(code => eq(sections.courseCode, code))),
                    });
                }

                if (existingSections.length > 0) {
                    const existingCodes = existingSections.map(s => s.courseCode).join(', ');
                    return wrapError(`Course code(s) already exist: ${existingCodes}`);
                }

                let success = false;
                let createdCourse: { courseID: number } | null = null;

                await ctx.db.transaction(async (tx) => {
                    // Create the course
                    const courseEntry = await tx.insert(courses).values({
                        courseTitle: input.course.courseTitle,
                        courseDescription: input.course.courseDescription,
                        academicYear: input.course.academicYear,
                        semester: input.course.semester,
                        courseEmployeeID: id,
                    }).returning();

                    if (courseEntry.length === 0) {
                        tx.rollback();
                        return;
                    }

                    createdCourse = courseEntry[0]!;

                    // Create sections
                    for (const section of input.course.sections) {
                        await tx.insert(courseSections).values({
                            courseID: createdCourse.courseID,
                            sectionName: section.sectionName,
                            courseCode: section.courseCode,
                        });
                    }

                    success = true;
                });

                if (success && createdCourse !== null) {
                    // Notify all students that a new course was created
                    try {
                        const allStudents = await ctx.db.query.students.findMany();
                        const studentIDs = allStudents.map(s => s.id);

                        if (studentIDs.length > 0) {
                            const notificationData = {
                                message: `A new course "${input.course.courseTitle}" has been created. Course codes: ${input.course.sections.map(s => s.courseCode).join(', ')}`,
                                courseTitle: input.course.courseTitle,
                                courseDescription: input.course.courseDescription,
                                courseID: createdCourse!.courseID,
                                courseCodes: input.course.sections.map(s => s.courseCode),
                            };

                            const response = await fetch('http://localhost:3001/api/notify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    userIds: studentIDs,
                                    data: notificationData,
                                }),
                            });

                            if (!response.ok) {
                                console.error('Failed to send course creation notifications:', await response.text());
                            } else {
                                console.log(`Sent course creation notification to ${studentIDs.length} student(s)`);
                            }
                        }
                    } catch (error) {
                        // Don't fail course creation if notification fails
                        console.error('Error sending course creation notifications:', error);
                    }

                    return wrapSuccess({ courseID: createdCourse.courseID });
                } else {
                    return wrapError('Failed to create course');
                }
            } catch (error) {
                console.error('Error creating course:', error);
                return wrapError('Invalid auth token');
            }
        }),

    enrollCourse: publicProcedure
        .input(z.object({
            token: z.string(),
            courseCode: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'student') {
                    return wrapError('User is not a student');
                }

                // Find the section by course code
                const section = await ctx.db.query.courseSections.findFirst({
                    where: (sections, { eq }) => eq(sections.courseCode, input.courseCode),
                });

                if (!section) {
                    return wrapError('Course code not found');
                }

                // Check if already enrolled
                const existingEnrollment = await ctx.db.query.enrollments.findFirst({
                    where: (enrollments, { and, eq }) => and(
                        eq(enrollments.studentID, id),
                        eq(enrollments.sectionID, section.sectionID),
                    ),
                });

                if (existingEnrollment) {
                    return wrapError('Already enrolled in this course section');
                }

                // Create enrollment
                await ctx.db.insert(enrollments).values({
                    studentID: id,
                    sectionID: section.sectionID,
                });

                // Get the course to find the instructor
                const courseWithInstructor = await ctx.db.query.courseSections.findFirst({
                    where: (sections, { eq }) => eq(sections.sectionID, section.sectionID),
                    with: {
                        course: true,
                    },
                });

                // Notify the instructor
                if (courseWithInstructor?.course?.courseEmployeeID) {
                    try {
                        const studentInfo = await ctx.db.query.users.findFirst({
                            where: (users, { eq }) => eq(users.id, id),
                        });

                        const notificationData = {
                            message: `A new student has enrolled in ${courseWithInstructor.course.courseTitle} - Section ${section.sectionName}`,
                            courseTitle: courseWithInstructor.course.courseTitle,
                            sectionName: section.sectionName,
                            courseCode: section.courseCode,
                            studentID: id,
                            studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Unknown',
                        };

                        const response = await fetch('http://localhost:3001/api/notify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userIds: [courseWithInstructor.course.courseEmployeeID],
                                data: notificationData,
                            }),
                        });

                        if (!response.ok) {
                            console.error('Failed to send enrollment notification:', await response.text());
                        } else {
                            console.log(`Sent enrollment notification to instructor ${courseWithInstructor.course.courseEmployeeID}`);
                        }
                    } catch (error) {
                        // Don't fail enrollment if notification fails
                        console.error('Error sending enrollment notification:', error);
                    }
                }

                return wrapSuccess({ sectionID: section.sectionID });
            } catch (error) {
                console.error('Error enrolling in course:', error);
                return wrapError('Invalid auth token');
            }
        }),

    submitExam: publicProcedure
        .input(z.object({
            token: z.string(),
            examID: z.number().int().positive(),
            sectionID: z.number().int().positive(),
            answers: z.array(z.object({
                questionID: z.number().int().positive(),
                answerData: z.unknown(),
            })),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify JWT token
            try {
                const { id, role } = jwt.verify(input.token, JWT_SECRET) as { id: number, role: string };
                if (role !== 'student') {
                    return wrapError('User is not a student');
                }

                // Verify the student is enrolled in a section where this exam is assigned
                const enrollment = await ctx.db.query.enrollments.findFirst({
                    where: (enrollments, { and, eq }) => and(
                        eq(enrollments.studentID, id),
                        eq(enrollments.sectionID, input.sectionID),
                    ),
                });

                if (!enrollment) {
                    return wrapError('Student is not enrolled in this section');
                }

                // Verify the exam is assigned to this section
                const assignedExam = await ctx.db.query.assignedExams.findFirst({
                    where: (assignedExams, { and, eq }) => and(
                        eq(assignedExams.examID, input.examID),
                        eq(assignedExams.sectionID, input.sectionID),
                    ),
                });

                if (!assignedExam) {
                    return wrapError('Exam is not assigned to this section');
                }

                // Check if student has already submitted
                const existingScore = await ctx.db.query.examScores.findFirst({
                    where: (scores, { and, eq }) => and(
                        eq(scores.examID, input.examID),
                        eq(scores.studentID, id),
                    ),
                });

                if (existingScore) {
                    return wrapError('You have already submitted this exam');
                }

                // Get exam questions to validate and calculate score
                const examQuestions = await ctx.db.query.examQuestions.findMany({
                    where: (questions, { eq }) => eq(questions.examID, input.examID),
                });

                // Verify all questions are answered
                if (input.answers.length !== examQuestions.length) {
                    return wrapError('Not all questions have been answered');
                }

                // Verify all answers correspond to valid questions
                const questionIDs = new Set(examQuestions.map(q => q.questionID));
                for (const answer of input.answers) {
                    if (!questionIDs.has(answer.questionID)) {
                        return wrapError('Invalid question ID in answers');
                    }
                }

                let success = false;
                let examScoreID: number | null = null;

                await ctx.db.transaction(async (tx) => {
                    // Create exam score record (initially 0, will be graded by instructor for essay questions)
                    const scoreEntry = await tx.insert(examScores).values({
                        examID: input.examID,
                        sectionID: input.sectionID,
                        studentID: id,
                        score: 0, // Will be calculated/graded later
                    }).returning();

                    if (scoreEntry.length === 0) {
                        tx.rollback();
                        return;
                    }

                    examScoreID = scoreEntry[0]!.examScoreID;

                    // Insert all answers
                    for (const answer of input.answers) {
                        await tx.insert(examAnswers).values({
                            examScoreID: examScoreID,
                            questionID: answer.questionID,
                            answerData: answer.answerData,
                            score: 0, // Will be calculated/graded later
                        });
                    }

                    success = true;
                });

                if (success) {
                    return wrapSuccess({ examScoreID });
                } else {
                    return wrapError('Failed to submit exam');
                }
            } catch (error) {
                console.error('Error submitting exam:', error);
                return wrapError('Invalid auth token');
            }
        }),
});
