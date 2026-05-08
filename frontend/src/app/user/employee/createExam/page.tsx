"use client";

import styles from "./page.module.css";
import sharedStyles from "~/app/user/components/shared.module.css";
import Nav from "~/app/user/components/userNav";
import { type ReactNode, useContext, useEffect, useState } from "react";
import { UserContext } from "~/app/UserContext";
import { RenderCustomExam, RenderEssay, RenderFileSubmission } from "./examTypes";
import { type Question, type InputQuestion, type OptionQuestion } from "./customExams";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api } from "~/trpc/react";
import type { ExamQuestionData } from "~/app/data/data";

export type ExamDetails = {
    examID: string;
    examTitle: string;
    examType: string;
    course: string;
    sections: string[];
    pageDescriptions: string[];
    dueDate: string;
    cutOffDate: string;
    releaseDate: string;
    examQuestions: Question[][]
}

const formattedDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

function previewExam(router: AppRouterInstance, examDetails: ExamDetails) {
    const jsonText = JSON.stringify(examDetails);
    console.log(jsonText);
    
    // temporary saving of exam so i can work on the generating of the exam
    localStorage.setItem("generatedExam", jsonText);
    router.push("../exam");
}

// Transform frontend Question type to API ExamQuestionData format
function transformQuestionToAPI(question: Question): ExamQuestionData | null {
    if (!question.type || !question.question) return null;

    const questionType = question.type.trim();
    
    // Handle Multiple Choice
    if (questionType === 'Multiple Choice') {
        const optionQuestion = question as OptionQuestion;
        if (!('options' in optionQuestion) || !optionQuestion.options || optionQuestion.options.length === 0) {
            return null;
        }
        // API expects exactly 4 options for multiple-choice
        const options = optionQuestion.options.slice(0, 4);
        while (options.length < 4) {
            options.push('');
        }
        return {
            type: 'multiple-choice',
            question: optionQuestion.question,
            options: options,
        };
    } else if (questionType === 'Short Answer') {
        const inputQuestion = question as InputQuestion;
        if (!('wordLimit' in inputQuestion)) return null;
        return {
            type: 'short-answer',
            question: inputQuestion.question,
            wordLimit: inputQuestion.wordLimit ?? undefined,
        };
    } else if (questionType === 'Paragraph') {
        const inputQuestion = question as InputQuestion;
        if (!('wordLimit' in inputQuestion)) return null;
        return {
            type: 'paragraph',
            question: inputQuestion.question,
            wordLimit: inputQuestion.wordLimit ?? undefined,
        };
    }
    
    // File Submission and other types are not supported by the API yet
    return null;
}

const toDateTimeLocal = (enUS: string) => {
    console.log("enUS: " + enUS);
    if(enUS === "Invalid Date" || enUS === "") return "";

    const clean = enUS.replace(" at ", " ");
    const d = new Date(Date.parse(clean));
    
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    console.log("d: " + d);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

export default function CreateExam() {
    const { baseUser, courses, refreshCourses } = useContext(UserContext);
    const rawData = localStorage.getItem("generatedExam");
    const createExamMutation = api.user.createExam.useMutation();

    function getSectionFromCourseTitle(courseTitle: string) {
        const course = courses.find(course => course.courseTitle === courseTitle);
        return course?.sections;   
    }

    const examID = useState(() => crypto.randomUUID())[0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const parsedData = useState<ExamDetails>((rawData) ? JSON.parse(rawData) : {
            examID,
            examTitle: "",
            examType: "",
            course: "",
            sections: [],
            pageDescriptions: [], 
            dueDate: "",
            cutOffDate: "",
            releaseDate: "",
            examQuestions: [[]]
        })[0];

    const [ examTitle, setExamTitle ] = useState<string>(parsedData.examTitle);
    const [ examType, setExamType ] = useState<string>(parsedData.examType);
    const [ course, setCourse ] = useState<string>(parsedData.course);
    const [ sections, setSections ] = useState<string[]>(parsedData.sections);
    const [ pageDescriptions, setPageDescriptions ] = useState<string[]>(parsedData.pageDescriptions)
    const [ dueDate, setDueDate ] = useState<string>(toDateTimeLocal(parsedData.dueDate));
    const [ cutOffDate, setCutOffDate ] = useState<string>(toDateTimeLocal(parsedData.cutOffDate));
    const [ releaseDate, setReleaseDate ] = useState<string>(toDateTimeLocal(parsedData.releaseDate));
    const [ isManuallyReleasing, setIsManuallyReleasing ] = useState<boolean>(false);
    
    const [ showSections, setShowSections ] = useState<boolean>(false);
    
    const [ questionObjs, setQuestionObjs ] = useState<Question[][]>(parsedData.examQuestions);
    
    const [ examDetails, setExamDetails ] = useState<ExamDetails>(parsedData);
    const router = useRouter();

    useEffect(() => {
        setShowSections(course !== "");
    }, [])

    useEffect(() => {
        setExamDetails({
            examID,
            examTitle,
            examType,
            course,
            sections,
            pageDescriptions,
            dueDate: new Date(dueDate).toLocaleString("en-US", formattedDate),
            cutOffDate: new Date(cutOffDate).toLocaleString("en-US", formattedDate),
            releaseDate: new Date(releaseDate).toLocaleString("en-US", formattedDate),
            examQuestions: questionObjs
        })
    }, [questionObjs, examTitle, examType, course, sections, dueDate, cutOffDate, releaseDate])

    if (!baseUser) return <p>No user is logged in</p>;
    if (baseUser.type !== "employee") return <p>User logged in is not employee</p>;
    if (!examID) return <p>examID is undefined</p>
    if (!examDetails) return <p>examDetails is undefined</p>
    console.log(examDetails);

    const RenderCourseOptions = () => {
        const listOfCourses:ReactNode[] = [];
        courses.forEach((courseTaught) => {
            listOfCourses.push(
                <option value={courseTaught.courseTitle} key={courseTaught.courseTitle}>{courseTaught.courseTitle}</option>
            )
        });
        return listOfCourses;
    }

    const RenderSectionOptions = () => {
        const sectionObjs = getSectionFromCourseTitle(course);
        
        const updateSections = (section: string, isChecked: boolean, index: number) => {
            setSections(prev => 
                isChecked 
                    ?   [ ...prev, section ]
                    :   prev.filter(s => s !== section)
            );
        };

        const listOfSections:ReactNode[] = [];
        sectionObjs?.forEach((section, index) => {
            listOfSections.push(
                <label key={section.sectionName}>
                    <input 
                        type="checkbox" 
                        value={section.sectionName} 
                        key={section.sectionName} 
                        checked={sections.some(s => s === section.sectionName)}
                        onChange={e => updateSections(e.target.value, e.target.checked, index)}
                    />
                    {section.sectionName}
                </label>
            );
        });
        return listOfSections;
    }

    const updateExamType = (examType: string) => {
        setExamType(examType);
        const id = crypto.randomUUID();
        setQuestionObjs(() => {
            const newQuestionObjs:Question[][] = [];
            if(examType !== "") {
                newQuestionObjs.push([ 
                    (examType === "File Submission") ? {
                            type: examType,
                            id,
                            question: "",
                            maxNoOfSubmissions: 3,
                            maxFileSize: "100 MB",
                            fileSubmissionTypes: [{ value: "All Files", label: "All Files" }]
                        }
                        : (examType === "Essay") ? {
                            type: "Paragraph",
                            id,
                            question: "",
                            wordLimit: 300
                        } 
                        : {
                            type: "Short Answer",
                            id,
                            question: "",
                            wordLimit: null
                        }
                ]);
            }
            return newQuestionObjs;
        });
        setPageDescriptions([]);
    }

    const handleSubmitExam = async () => {
        if (!baseUser || !baseUser.authToken) {
            alert("User not authenticated");
            return;
        }

        // Validate required fields
        if (!examTitle.trim()) {
            alert("Please enter an exam title");
            return;
        }

        if (!course) {
            alert("Please select a course");
            return;
        }

        if (sections.length === 0) {
            alert("Please select at least one section");
            return;
        }

        if (!dueDate) {
            alert("Please set a due date");
            return;
        }

        // Validate due date
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
            alert("Please enter a valid due date");
            return;
        }

        // Find courseID from course title
        const selectedCourse = courses.find(c => c.courseTitle === course);
        if (!selectedCourse) {
            alert("Selected course not found");
            return;
        }

        // Convert section names to sectionIDs
        const sectionIDs = sections
            .map(sectionName => {
                const section = selectedCourse.sections.find(s => s.sectionName === sectionName);
                return section?.sectionID;
            })
            .filter((id): id is number => id !== undefined);

        if (sectionIDs.length === 0) {
            alert("No valid sections found");
            return;
        }

        // Flatten questions from all pages and transform them
        const allQuestions = questionObjs.flat();
        const unsupportedTypes = new Set<string>();
        const transformedQuestions = allQuestions
            .map(question => {
                const questionData = transformQuestionToAPI(question);
                if (!questionData) {
                    if (question.type) {
                        unsupportedTypes.add(question.type);
                    }
                    return null;
                }
                return {
                    points: 1, // Default points, can be made configurable later
                    questionData,
                };
            })
            .filter((q): q is { points: number; questionData: ExamQuestionData } => q !== null);

        if (transformedQuestions.length === 0) {
            alert("Please add at least one valid question. Supported types: Multiple Choice, Short Answer, Paragraph");
            return;
        }

        // Warn about unsupported question types
        if (unsupportedTypes.size > 0) {
            const unsupportedList = Array.from(unsupportedTypes).join(", ");
            const proceed = confirm(
                `Warning: The following question types are not supported and will be excluded: ${unsupportedList}\n\n` +
                `Only ${transformedQuestions.length} question(s) will be submitted. Continue?`
            );
            if (!proceed) {
                return;
            }
        }

        // Format due date as ISO string
        const formattedDueDate = new Date(dueDate).toISOString();

        try {
            const result = await createExamMutation.mutateAsync({
                token: baseUser.authToken,
                exam: {
                    examTitle: examTitle.trim(),
                    timeAllotted: "60 minutes", // Default, can be made configurable
                    dueDate: formattedDueDate,
                    courseID: selectedCourse.courseID,
                    assigned: sectionIDs.map(sectionID => ({ sectionID })),
                    questions: transformedQuestions,
                },
            });

            if (result.status === 'ok') {
                alert("Exam created successfully!");
                refreshCourses();
                // Optionally redirect or clear form
                router.push("/user/employee/courses");
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error creating exam:", error);
            alert("Failed to create exam. Please try again.");
        }
    }

    return (
        <div className={sharedStyles.page}>
            <Nav scope="employee" />

            <main className={`${sharedStyles.main} ${styles.main} main `}>
                <div className={sharedStyles.examCourseDiv}>
                    <p className="title22px">Creating a New Exam</p>
                    <div className={styles.rowDiv}>
                        <label>Exam Title</label>
                        <input 
                            type="text" 
                            value={examTitle}
                            className={styles.examTitle}
                            onChange={e => setExamTitle(e.target.value)}
                        />
                    </div>  
                    <div className={styles.rowDiv}>
                        {/* <label>
                            Exam Type
                            <select 
                                value={examType}
                                onChange={e => updateExamType(e.target.value)}
                            >
                                <option value="">Select option</option>
                                <option value="File Submission">File Submission</option>
                                <option value="Create Exam">Create Custom Exam</option>
                                <option value="Essay">Essay</option>
                            </select>
                        </label>*/}
                        <label>
                            Course
                            <select 
                                value={course}
                                onChange={e => {
                                    setCourse(e.target.value);
                                    setShowSections((e.target.value !== ""));
                                }}
                            >
                                <option value="">Select option</option>
                                <RenderCourseOptions />
                            </select>  
                        </label>  
                        { showSections && (<label>
                            Section
                            <RenderSectionOptions />
                        </label>) }
                    </div>

                    <div className={styles.rowDiv}>
                        <label>
                            Due Date
                            <input 
                                type="datetime-local" 
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                            />
                        </label>
                        {/* <label>
                            Cut-Off Date
                            <input 
                                type="datetime-local" 
                                value={cutOffDate}
                                onChange={e => setCutOffDate(e.target.value)}
                            />
                        </label> */}
                    </div>

                    {/* <div className={styles.rowDiv}>
                        <label>
                            Exam Release Date
                            <input 
                                type="datetime-local"
                                value={releaseDate}
                                onChange={e => {
                                    setReleaseDate(e.target.value);
                                    setIsManuallyReleasing(false);
                                }}
                            />
                        </label>
                        <label>
                            <input 
                                type="radio"
                                checked={isManuallyReleasing}
                                onChange={e => {
                                    setIsManuallyReleasing(!isManuallyReleasing);
                                    setReleaseDate("");
                                }}
                            />
                            Manually Release Exam
                        </label>
                    </div> */}
                    
                </div>

                <div className={sharedStyles.examCourseDiv}>
                    {/* { ((examType === "File Submission") && (<RenderFileSubmission questionObjs={questionObjs} setQuestionObjs={setQuestionObjs}/>))}
                    { (examType === "Essay") && (<RenderEssay questionObjs={questionObjs} setQuestionObjs={setQuestionObjs}/>)}
                    { (examType === "Create Exam") && (<RenderCustomExam pageDescriptions={pageDescriptions} setPageDescriptions={setPageDescriptions} questionObjs={questionObjs} setQuestionObjs={setQuestionObjs}/>)} */}
                    
                    <RenderCustomExam
                        pageDescriptions={pageDescriptions}
                        setPageDescriptions={setPageDescriptions}
                        questionObjs={questionObjs}
                        setQuestionObjs={setQuestionObjs}
                    />
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button 
                            className="primaryButton"
                            disabled={examType === ""}
                            onClick={() => previewExam(router, examDetails)}
                        >
                            Preview Exam
                        </button>
                        <button 
                            className="primaryButton"
                            disabled={createExamMutation.isPending || !examTitle.trim() || !course || sections.length === 0 || !dueDate}
                            onClick={handleSubmitExam}
                        >
                            {createExamMutation.isPending ? "Creating..." : "Create Exam"}
                        </button>
                    </div>
                    {createExamMutation.isError && (
                        <p style={{ color: "red", marginTop: "10px" }}>
                            Error: {createExamMutation.error?.message || "Failed to create exam"}
                        </p>
                    )}
                </div>
                
            </main>
        </div>
    );
}
