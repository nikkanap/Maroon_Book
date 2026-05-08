"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import Logo from "~/app/_components/logo";
import { type ReactElement, useContext, useState } from "react";

import { type Section, type UserExamData } from "~/app/data/data";
import { type StudentUser, UserContext } from "~/app/UserContext";
import { getEnrolledSection } from "../page";
import { LinkButton } from "~/app/_components/links";
import { api } from "~/trpc/react";

export default function StudentCourses() {
    const [ showOverlay, setShowOverlay]  = useState(false);
    const { baseUser, courses, userExams, refreshCourses } = useContext(UserContext);
    const enrollCourseMutation = api.user.enrollCourse.useMutation();

    // Form state
    const [courseCode, setCourseCode] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "student") return <p>User logged in is not a student</p>;

    // rendering a number of courses lol
    const coursesArray: ReactElement[] = [];

    courses.forEach((course) => {
        const enrolledSection = getEnrolledSection(course, baseUser);
        const fullCourseTitle = `${course.courseTitle} - ${enrolledSection?.sectionName}`;
        const fullCourseDescription = `${course.courseDescription} | ${course.academicYear} ${course.semester}`;
        const noOfExams = getNoOfExamsPerSection(enrolledSection, baseUser, userExams);
        coursesArray.push(addCourseToPage(
            course.courseID,
            fullCourseTitle,
            fullCourseDescription,
            noOfExams
        ))
    });
    

    return (
        <div className={`${sharedStyles.page} ${styles.page}`}>
            <Nav scope="student" />

            <main className={`${sharedStyles.main} ${styles.main} main`}>
                <p className="title22px">Courses</p>

                { coursesArray }

                <button
                    className={styles.enrollCourse}
                    onClick={() => setShowOverlay(true)}
                >
                  +
                </button>

                {showOverlay && (
                    <div className={styles.filter}></div>
                )}
                {showOverlay && (
                    <div className={styles.overlay}>
                        <Logo width={217} height={26} />
                        <p className={styles.overlayTitle}>Enroll a course</p>
                        
                        <div>
                            <p>To enroll on a course, please</p>
                            <p> enter the course code below.</p>
                        </div>
                        
                        <div className={styles.inputContainer}>
                            <label>Course Code:
                                <input 
                                    type="text" 
                                    name="courseCode" 
                                    className={styles.courseCode}
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    placeholder="e.g., CMSC135-L"
                                />
                            </label>
                        </div>

                        {errorMessage && (
                            <p style={{ color: "red", margin: "10px 0" }}>{errorMessage}</p>
                        )}

                        <button 
                            className="primaryButton"
                            disabled={enrollCourseMutation.isPending}
                            onClick={async () => {
                                if (!baseUser?.authToken) {
                                    setErrorMessage("User not authenticated");
                                    return;
                                }

                                if (!courseCode.trim()) {
                                    setErrorMessage("Course code is required");
                                    return;
                                }

                                setErrorMessage(null);

                                try {
                                    const result = await enrollCourseMutation.mutateAsync({
                                        token: baseUser.authToken,
                                        courseCode: courseCode.trim(),
                                    });

                                    if (result.status === 'ok') {
                                        // Reset form
                                        setCourseCode("");
                                        setShowOverlay(false);
                                        // Refresh courses
                                        refreshCourses();
                                    } else {
                                        setErrorMessage(result.message);
                                    }
                                } catch (error) {
                                    console.error("Error enrolling in course:", error);
                                    setErrorMessage("Failed to enroll in course. Please try again.");
                                }
                            }}
                        >
                            {enrollCourseMutation.isPending ? "Enrolling..." : "Submit"}
                        </button>

                        <button 
                            className={styles.exitOverlay} 
                            onClick={() => {
                                setShowOverlay(false);
                                setErrorMessage(null);
                                setCourseCode("");
                            }}
                        >
                            ✖
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function addCourseToPage(courseID: number, courseTitle: string, courseDescription: string, noOfExams: number) {
    return (
        <div className={sharedStyles.examCourseDiv} key={courseID}>
            <p className="title22px">{courseTitle}</p>
            <p className={sharedStyles.description}>{courseDescription}</p>

            <div className={sharedStyles.information}>
                <p>Total Exams: {noOfExams}</p>

                <LinkButton href={`/user/student/courses/viewCourseReport?courseID=${courseID}`} className="">
                    View Course Report
                </LinkButton>
            </div>
        </div>
    );
}

export function getNoOfExamsPerSection(enrolledSection: Section | undefined, baseUser: StudentUser, userExams: UserExamData[]) {
    if(enrolledSection === undefined) return 0;
    return userExams.filter(exam => exam.assigned.some(assgn => assgn.sectionID === enrolledSection.sectionID)).length;
}
