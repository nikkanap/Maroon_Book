"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import { type ReactElement, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type Course, type Section, type UserExamData } from "~/app/data/data";
import { getEnrolledSection } from "../../page";
import { type StudentUser, UserContext } from "~/app/UserContext";
import { getNoOfExamsPerSection } from "../page";

export default function ViewCourseReport() {
    const [ selectedCourse, setSelectedCourse ] = useState<Course|null>(null);
    const [ section, setSection ] = useState<Section|undefined>(undefined);
    const { baseUser, courses, userExams } = useContext(UserContext);
    const [ noOfExams, setNoOfExams ] = useState<number>(0);
    const searchParams = useSearchParams();

    useEffect(() => {
        const courseID = searchParams.get("courseID");
        if (!courseID) return;

        const found = courses.find(course => course.courseID === Number(courseID));
        setSelectedCourse(found ?? null);
    }, [courses, searchParams]);

    useEffect(() => {
        if (!selectedCourse || !baseUser) return;
        if (baseUser.type !== "student") return;

        setSection(getEnrolledSection(selectedCourse, baseUser));
    }, [selectedCourse, baseUser]);

    useEffect(() => {
        if (!selectedCourse || !section || !baseUser) return;
        if (baseUser.type !== "student") return;

        setNoOfExams(getNoOfExamsPerSection(section, baseUser, userExams));
    }, [selectedCourse, section, baseUser, userExams]);
    
    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "student") return <p>User logged in is not a student</p>;
    if (!selectedCourse) return <p>there is no selected course</p>;
    
    return (
        <div className="page">
            <Nav scope="student" />

            <main className={`${styles.main} ${sharedStyles.main} main`}>
                <div className={`${styles.examCourseDiv} ${sharedStyles.examCourseDiv}`}>
                    <p className="title22px">
                        {selectedCourse.courseTitle} - {section?.sectionName}
                    </p>

                    <RenderExamContent 
                        selectedCourse={selectedCourse} 
                        noOfExams={noOfExams}
                        baseUser={baseUser}
                        userExams={userExams}
                    />
                </div>
            </main>
        </div>
    );
}

function RenderExamContent({
    selectedCourse,
    noOfExams,
    baseUser,
    userExams
}:{
    selectedCourse: Course | null,
    noOfExams: number,
    baseUser: StudentUser,
    userExams: UserExamData[],
}) {
    return (
        <div className={`${styles.examReportDiv}`}>
            <p className={styles.subheading}>Course Information</p>
            <div className={styles.information}>
                <p>Total number of exams: {noOfExams}</p>
            </div>

            <p className={styles.subheading}>Exam Report</p>
            <RenderScores selectedCourse={selectedCourse} baseUser={baseUser} userExams={userExams} />
        </div>
    );
}

function RenderScores({
    selectedCourse,
    baseUser,
    userExams,
}:{
    selectedCourse: Course | null,
    baseUser: StudentUser,
    userExams: UserExamData[],
}) {
    const GetScoreContent = () => {
        const examScoreContent: ReactElement[] = [];

        if(!selectedCourse) return null;

        let counter = 1;
        userExams
            .filter(exam => exam.courseID === selectedCourse.courseID)
            .map(exam => {
                console.log(baseUser.id);
                const { score, grade } = getScoreAndGrade(exam, baseUser.id);
                    examScoreContent.push(
                        <div className={styles.examDetailsAVG} key={exam.examID}>
                            <p>{counter++}</p>
                            <p>{exam.examTitle}</p>
                            <p>{exam.questions.length}</p>
                            <p>{score}</p>
                            <p>{grade.toFixed(2)}%</p>
                        </div>
                    );
            });
        return examScoreContent;
    }

    return (
        <div>
            <div className={styles.examDetailsAVG}>
                <p className={styles.bold}>Exam No.</p>
                <p className={styles.bold}>Exam Title</p>
                <p className={styles.bold}>No. of Items</p>
                <p className={styles.bold}>Score</p>
                <p className={styles.bold}>Grade</p>
            </div>
            <GetScoreContent />
        </div>
    );
}

function getScoreAndGrade(exam: UserExamData, studentID: number) {
    const studentScore = exam.scores.find(score => score.studentID === studentID);

    let score = 0;
    let grade = 0;
    if(studentScore === undefined) {
        console.log("STUDENT EXAM IS UNDEFINED");
        return { score, grade };
    }

    score = studentScore.score;
    grade = (score / exam.questions.reduce((acc, question) => acc + question.points, 0)) * 100;
    return { score, grade };
}
