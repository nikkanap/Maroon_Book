"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import Logo from "~/app/_components/logo";
import { type ReactElement, useContext, useState } from "react";

import { UserContext } from "~/app/UserContext";
import { LinkButton } from "~/app/_components/links";
import { api } from "~/trpc/react";

export default function EmployeeCourses() {
    const [ showOverlay, setShowOverlay ]  = useState(false);
    const { baseUser, courses, userExams, refreshCourses } = useContext(UserContext);
    const createCourseMutation = api.user.createCourse.useMutation();

    // Form state
    const [courseTitle, setCourseTitle] = useState("");
    const [courseDescription, setCourseDescription] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [semester, setSemester] = useState("");
    const [sectionsInput, setSectionsInput] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "employee") return <p>User logged in is not employee</p>;

    const coursesArray: ReactElement[] = [];

    const coursesTaught = courses.filter(course => {
        return course.courseEmployeeID === baseUser.id
    });

    coursesTaught.forEach((course) => {
        const fullCourseDescription = course.courseDescription + " | " + course.academicYear + " " + course.semester;
        const noOfExams = userExams.filter(exam => exam.courseID === course.courseID).length;
        coursesArray.push(addCourseToPage(
            course.courseID,
            course.courseTitle,
            fullCourseDescription,
            noOfExams
        ))
    });

    return (
        <div className={`${sharedStyles.page} ${styles.page}`}>
            <Nav scope="employee" />

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
                        <p className={styles.overlayTitle}>Create a course</p>

                        <div>
                            <p>To create on a course, please</p>
                            <p>fill in the information below.</p>
                        </div>

                        <div className={styles.inputContainer}>
                            <label>Course Title:
                                <input 
                                    type="text" 
                                    name="courseTitle" 
                                    className={styles.courseCode}
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                />
                            </label>
                            <label>Course Description:
                                <textarea 
                                    name="courseDescription" 
                                    className={styles.courseCode}
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    rows={3}
                                />
                            </label>
                            <label>Academic Year:
                                <input 
                                    type="text" 
                                    name="academicYear" 
                                    className={styles.courseCode}
                                    placeholder="e.g., 2024-2025"
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                />
                            </label>
                            <label>Semester:
                                <select 
                                    name="semester" 
                                    className={styles.courseCode}
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                >
                                    <option value="">Select semester</option>
                                    <option value="1st Semester">1st Semester</option>
                                    <option value="2nd Semester">2nd Semester</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </label>
                            <label>Sections (format: SectionName:CourseCode, one per line):
                                <textarea 
                                    name="sections" 
                                    className={styles.courseCode}
                                    placeholder="L:CMSC135-L&#10;M:CMSC135-M"
                                    value={sectionsInput}
                                    onChange={(e) => setSectionsInput(e.target.value)}
                                    rows={4}
                                />
                            </label>
                        </div>

                        {errorMessage && (
                            <p style={{ color: "red", margin: "10px 0" }}>{errorMessage}</p>
                        )}

                        <button 
                            className="primaryButton"
                            disabled={createCourseMutation.isPending}
                            onClick={async () => {
                                if (!baseUser?.authToken) {
                                    setErrorMessage("User not authenticated");
                                    return;
                                }

                                // Validate inputs
                                if (!courseTitle.trim()) {
                                    setErrorMessage("Course title is required");
                                    return;
                                }
                                if (!courseDescription.trim()) {
                                    setErrorMessage("Course description is required");
                                    return;
                                }
                                if (!academicYear.trim()) {
                                    setErrorMessage("Academic year is required");
                                    return;
                                }
                                if (!semester) {
                                    setErrorMessage("Semester is required");
                                    return;
                                }
                                if (!sectionsInput.trim()) {
                                    setErrorMessage("At least one section is required");
                                    return;
                                }

                                // Parse sections
                                const sectionLines = sectionsInput.split('\n').map(s => s.trim()).filter(s => s);
                                const sections = sectionLines.map(line => {
                                    const parts = line.split(':');
                                    if (parts.length !== 2) {
                                        throw new Error(`Invalid section format: ${line}. Expected format: SectionName:CourseCode`);
                                    }
                                    return {
                                        sectionName: parts[0]!.trim(),
                                        courseCode: parts[1]!.trim(),
                                    };
                                });

                                if (sections.length === 0) {
                                    setErrorMessage("At least one section is required");
                                    return;
                                }

                                setErrorMessage(null);

                                try {
                                    const result = await createCourseMutation.mutateAsync({
                                        token: baseUser.authToken,
                                        course: {
                                            courseTitle: courseTitle.trim(),
                                            courseDescription: courseDescription.trim(),
                                            academicYear: academicYear.trim(),
                                            semester,
                                            sections,
                                        },
                                    });

                                    if (result.status === 'ok') {
                                        // Reset form
                                        setCourseTitle("");
                                        setCourseDescription("");
                                        setAcademicYear("");
                                        setSemester("");
                                        setSectionsInput("");
                                        setShowOverlay(false);
                                        // Refresh courses
                                        refreshCourses();
                                    } else {
                                        setErrorMessage(result.message);
                                    }
                                } catch (error) {
                                    console.error("Error creating course:", error);
                                    setErrorMessage("Failed to create course. Please try again.");
                                }
                            }}
                        >
                            {createCourseMutation.isPending ? "Creating..." : "Submit"}
                        </button>

                        <button 
                            className={styles.exitOverlay} 
                            onClick={() => {
                                setShowOverlay(false);
                                setErrorMessage(null);
                                setCourseTitle("");
                                setCourseDescription("");
                                setAcademicYear("");
                                setSemester("");
                                setSectionsInput("");
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

                <LinkButton href={`/user/employee/courses/viewCourseReport?courseID=${courseID}`} className="">
                    View Course Report
                </LinkButton>
            </div>
        </div>
    );
}
