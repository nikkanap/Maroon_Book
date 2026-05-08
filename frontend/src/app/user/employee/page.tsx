"use client";

import mainStyle from "./page.module.css";
import styles from "~/app/user/components/shared.module.css";
import Nav from "~/app/user/components/userNav";
import { type ReactNode, useContext } from "react";
import { type EmployeeUser, UserContext } from "~/app/UserContext";
import { LinkButton } from "~/app/_components/links";
import type { Course, UserExamData } from "~/app/data/data";
import { api } from "~/trpc/client";

export default function EmployeeDashboard() {
    const { baseUser, userExams, courses } = useContext(UserContext);

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "employee") return <p>User logged in is not employee</p>;

    return (
        <div className={styles.page}>
            <Nav scope="employee" />
            <main className={`${styles.main} ${mainStyle.main} main `}>
                <div className={styles.upperDiv}>
                    <p className="title22px">Dashboard</p>
                    <LinkButton href="/user/employee/createExam" className="primaryButton">
                        Create New Exam
                    </LinkButton>
                </div>
                <RenderExamList baseUser={baseUser} userExams={userExams} courses={courses} />
            </main>
        </div>
    );
}

function RenderExamList({
    baseUser,
    userExams,
    courses
}: {
    baseUser: EmployeeUser,
    userExams: UserExamData[],
    courses: Course[],
}) {
    const indivExamContent = (exam: UserExamData, examDescription: string, sectionNames: string) => {
        return(
            <div className={styles.examCourseDiv} key={exam.examID}>
                <p className="title22px">{exam.examTitle}</p>
                <p className={styles.description}>{examDescription}</p>
                <div className={styles.information}>
                    <p>Sections: {sectionNames}</p>
                    <p>Total Items: {exam.questions.length}</p>
                    <p>Time Allotted: {exam.timeAllotted}</p>
                    <p>Due Date: {exam.dueDate}</p>
                    <a>Publish Exam</a>
                    <a>Hide Exam</a>
                    <LinkButton href={`/user/employee/viewExam?examID=${encodeURIComponent(exam.examID)}`} className="">View Exam</LinkButton>
                </div>
            </div>
        );
    }

    const examList: ReactNode[] = [];

    courses.forEach((course) => {
        const exams = userExams.filter(refExam => refExam.courseID === course.courseID);
        
        let sectionNames = "";
        course.sections.forEach(section => sectionNames += `${section.sectionName} , `);
        sectionNames.slice(0, sectionNames.length-2);

        exams.forEach((refExam) => {
            const courseDescription = `${course.courseTitle} | ${course.courseDescription}`
            examList.push(indivExamContent(refExam, courseDescription, sectionNames));
        });
    });

    return examList;
}
