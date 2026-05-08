"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import { type ReactElement, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type Course, type Section, type UserExamData } from "~/app/data/data";
import { UserContext } from "~/app/UserContext";

export default function ViewCourseReport() {
  const { courses, userExams } = useContext(UserContext);

  const [ selectedSection, setSelectedSection ] = useState<string>("All Sections");
  const [ selectedDisplay, setSelectedDisplay ] = useState<string>("Average");
  const [ selectedCourse, setSelectedCourse ] = useState<Course|null>(null);
  const [ sections, setSections ] = useState<Section[]|null>(null);
  const { noOfStudents, noOfExams } = getUpdatedInformation(selectedCourse, userExams, selectedSection);
  const searchParams = useSearchParams();

  // for every effect that occurs
  useEffect(() => {
    const courseID = searchParams.get("courseID");
    if(!courseID) return;

    const found = courses.find(course => course.courseID === Number(courseID))
    setSelectedCourse(found ?? null);
  }, [courses, searchParams]);
  
  useEffect(() => {
    if(!selectedCourse) return;
    setSections(selectedCourse.sections || null);
  }, [selectedCourse]);

  // rendering the section options
  const RenderSectionOptions = () => {
    const sectionOptions: ReactElement[] = [];
    if(!sections) return sectionOptions;

    sections.forEach((section) => {
      sectionOptions.push(
        <option value={section.sectionName} key={section.sectionName}>Section {section.sectionName}</option>
      );
    });
    return sectionOptions;
  }
  
  if(!selectedCourse) return <p>Selected Course is NULL</p>;

  // main page content
  return (
    <div className="page">
      <Nav scope="employee" />

      <main className={`${styles.main} ${sharedStyles.main} main`}>
        <div className={`${styles.examCourseDiv} ${sharedStyles.examCourseDiv}`}>
          <p className="title22px">{selectedCourse.courseTitle}</p>
          <div className={styles.selectDiv}>
            <label>View Report For:</label>
            <select 
              name="selectedSection" 
              value={ selectedSection }
              onChange={ e => setSelectedSection(e.target.value) }
            >
              <RenderSectionOptions />
              <option value="All Sections">All Sections</option>
            </select>
          </div>
          <div className={styles.selectDiv}>
            <label>Display:</label>
            <select 
              name="selectedDisplay" 
              value={ selectedDisplay }
              onChange={ e => setSelectedDisplay(e.target.value) }
            >
              <option value="Average">Average</option>
              <option value="All Scores">All Scores</option>
            </select>
          </div>
          <hr/>
          <RenderExamContent 
            selectedCourse={selectedCourse} 
            sectionName={selectedSection}
            sectionID={(selectedSection === "All Sections") ? -1 :
                        (sections ? sections.find(section => section.sectionName === selectedSection)?.sectionID ?? -1 : -1)} 
            noOfStudents={noOfStudents}
            noOfExams={noOfExams}
            selectedDisplay={selectedDisplay}
            exams={userExams}
          />
        </div>
      </main>
    </div>
  );
}

// getting the updated information
function getUpdatedInformation(selectedCourse: Course | null, exams: UserExamData[], selectedSectionName: string) {
  let noOfStudents = 0;
  let noOfExams = 0;

  if(!selectedCourse) return { noOfStudents, noOfExams };

  // get the sections within the course
  const sections = selectedCourse.sections;

  let targetSectionIds: number[] = [];
  if (selectedSectionName === "All Sections") {
    sections.forEach(section => noOfStudents += section.studentsEnrolled.length);
    targetSectionIds = sections.map(section => section.sectionID);
  } else {
    const selectedSection = sections.find(section => section.sectionName === selectedSectionName);
    if(!selectedSection) return { noOfStudents, noOfExams };

    noOfStudents = selectedSection.studentsEnrolled.length;
    targetSectionIds = [selectedSection.sectionID];
  }

  noOfExams = exams.filter(exam => exam.assigned.some(assignedExam => targetSectionIds.includes(assignedExam.sectionID))).length;
  return { noOfStudents, noOfExams };
}

function RenderExamContent({
  selectedCourse,
  sectionName,
  sectionID,
  noOfStudents,
  noOfExams,
  selectedDisplay,
  exams,
}: {
  selectedCourse: Course | null,
  sectionName: string,
  sectionID: number,
  noOfStudents: number,
  noOfExams: number,
  selectedDisplay: string,
  exams: UserExamData[],
}) {
  console.log(selectedDisplay);
  return (
    <div className={`${styles.examReportDiv}`}>
      <p className={styles.subheading}>Course Information</p>
      <div className={styles.information}>
        <p>Section: {sectionName}</p>
        <p>Total number of students: {noOfStudents}</p>
        <p>Total number of exams: {noOfExams}</p>
      </div>

      <p className={styles.subheading}>Exam Report</p>
      { (selectedDisplay === "Average") ? 
        <RenderAverageScores selectedCourse={selectedCourse} sectionID={sectionID} exams={exams} /> : 
        <RenderAllScores selectedCourse={selectedCourse} sectionID={sectionID} exams={exams} /> 
      }
    </div>
  );
}

function RenderAverageScores({
  selectedCourse,
  sectionID,
  exams,
}: {
  selectedCourse: Course | null,
  sectionID: number,
  exams: UserExamData[],
}) {
  const GetScoreContent = () => {
    const examScoreContent: ReactElement[] = [];
    if(!selectedCourse) return null;

    let counter = 1;
    exams
      .filter(exam => exam.courseID === selectedCourse.courseID)
      .map(exam => {
        const { averageScores, noOfTakers } = getAVGScoresAndNoOfTakers(exam, sectionID);
          examScoreContent.push(
            <div className={styles.examDetailsAVG} key={exam.examID}>
              <p>{counter++}</p>
              <p>{exam.examTitle}</p>
              <p>{exam.questions.length}</p>
              <p>{averageScores.toFixed(2)}%</p>
              <p>{noOfTakers}</p>
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
        <p className={styles.bold}>Average Score</p>
        <p className={styles.bold}>No. of Takers</p>
      </div>
      <GetScoreContent />
    </div>
  );
}

function getAVGScoresAndNoOfTakers(exam: UserExamData, sectionID: number) {
  let totalScore = 0;
  let noOfTakers = 0;
  
  exam.scores
    .filter((examScore) => {
      return (sectionID === -1) ? true : (examScore.sectionID === sectionID);
    })
    .map((examScore) => {
      noOfTakers++;
      totalScore += examScore.score / exam.questions.reduce((acc, question) => acc + question.points, 0) * 100;
    });

  const averageScores = totalScore / noOfTakers;
  return { averageScores, noOfTakers };
}

// rendering for all scores
function RenderAllScores({
  selectedCourse,
  sectionID,
  exams,
}: {
  selectedCourse: Course | null,
  sectionID: number,
  exams: UserExamData[],
}) {
  const GetScoreContent = () => {
    const fullExamScoreContent: ReactElement[] = [];

    if(!selectedCourse) return fullExamScoreContent;

    const StudentExamScores = ({ exam }: { exam: UserExamData }) => {
      const individualExamScore: ReactElement[] = [];

      exam.scores
        .filter((examScore) => {
          return (sectionID === -1) ? true : (examScore.sectionID === sectionID);
        })
        .map((examScore) => {
          const studentNo = examScore.studentID;
          const score = examScore.score;
          const totalPoints = exam.questions.reduce((acc, question) => acc + question.points, 0);
          const grade = ((score / totalPoints) * 100).toFixed(2);
          const scoreWithItems = score + "/" + totalPoints;
          
          individualExamScore.push(
            <div className={styles.examDetailsAll} key={studentNo}>
              <p>{studentNo}</p>
              <p>{scoreWithItems}</p>
              <p>{grade}%</p>
            </div>
          )
        });

      return individualExamScore;
    };

    let counter = 1;
    exams
      .filter(exam => exam.courseID === selectedCourse.courseID)
      .map((exaam) => {
        fullExamScoreContent.push(
          <div className={styles.examReportDiv} key={exaam.examID}>
            <div className={styles.examHeading}>
              <p>Exam No.: {counter++}</p>
              <p>Title: {exaam.examTitle}</p>
            </div>
            <div className={styles.examDetailsAll}>
              <p className={styles.bold}>Student No.</p>
              <p className={styles.bold}>Score</p>
              <p className={styles.bold}>Grade</p>
            </div>
            <StudentExamScores exam={exaam} />
          </div>
        );
      });

    return fullExamScoreContent;
  }

  return (
    <GetScoreContent />
  );
}
