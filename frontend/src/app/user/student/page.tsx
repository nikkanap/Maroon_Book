"use client";

import { type Course, type Section, type UserExamData } from "~/app/data/data";
import mainStyle from "./page.module.css";
import styles from "~/app/user/components/shared.module.css";
import Nav from "~/app/user/components/userNav";
import { LinkButton } from "~/app/_components/links";
import { type ReactNode, useContext } from "react";
import { type StudentUser, UserContext } from "~/app/UserContext";

export default function StudentDashboard() {
    const { baseUser, courses, userExams } = useContext(UserContext);

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "student") return <p>User logged in is not a student</p>;

    return (
        <div className={styles.page}>
            <Nav scope="student" />
            <main className={`${styles.main} ${mainStyle.main} main `}>
                <p className="title22px">Dashboard</p>
                <RenderExamList baseUser={baseUser} courses={courses} userExams={userExams} />
            </main>
        </div>
    );
}

function RenderExamList({ baseUser, courses, userExams }:{ baseUser: StudentUser, courses: Course[], userExams: UserExamData[] }) {
    const indivExamContent = (exam: UserExamData, examDescription: string, tookExam: string) => {
        const pastDueDate = new Date() <= new Date(exam.dueDate);

        return (
            <div className={styles.examCourseDiv} key={exam.examID}>
                <p className="title22px">{exam.examTitle}</p>
                <p className={styles.description}>{examDescription}</p>
                <div className={styles.information}>
                    <p>Total Items: {exam.questions.length}</p>
                    <p>Time Allotted: {exam.timeAllotted}</p>
                    <p>Due Date: {exam.dueDate}</p>
                    <p>Taken Exam: {tookExam}</p>
                    <a>Hide Exam</a>

                    {tookExam === "No" && pastDueDate && (
                        <LinkButton href={`/user/student/takeExam?examID=${encodeURIComponent(exam.examID)}`} className="">Take Exam</LinkButton>
                    )}

                    {tookExam === "Yes" && (
                        <a>View Exam</a>
                    )}
                </div>
            </div>
        );
    }

    const examList: ReactNode[] = [];

    courses.forEach((course) => {
        console.log("inside of coursesEnrolled");
        console.log(course.courseTitle);
        const refExams = userExams.filter(exam => exam.courseID === course.courseID);
        
        const section = getEnrolledSection(course, baseUser);

        if(section === undefined)
            return;

        refExams.forEach((exam) => {
            const courseDescription = `${course.courseTitle} - ${section.sectionName} | ${course.courseDescription}`;
            const tookExam = tookTheExam(exam, baseUser.id) ? "Yes" : "No";
            examList.push(indivExamContent(exam, courseDescription, tookExam));
        });
    }); 

    return examList;
}

export function isEnrolledInCourse(course: Course, baseUser: StudentUser) {
    if(!baseUser) return undefined;
    return course.sections.some(section => isEnrolledInSection(section, baseUser));
}

export function getEnrolledSection(course: Course, baseUser: StudentUser | null) {
    if(!baseUser) return undefined;
    const enrolledSection = course.sections.find(section => isEnrolledInSection(section, baseUser));
    console.log("ENROLLED SECTION = " + enrolledSection?.sectionName);
    return enrolledSection;
}

export function isEnrolledInSection(section: Section, baseUser: StudentUser) {
    const found = section.studentsEnrolled.some(studentID => {
        console.log(`${studentID} === ${baseUser.id} = ${studentID === baseUser.id}`);
        return studentID === baseUser.id;
    }); 
    console.log(`Found?? = ${found}`);
    return found;
}

export function tookTheExam(exam: UserExamData, studentID: number){
    return exam.scores.some(scoreData => scoreData.studentID === studentID);
}
