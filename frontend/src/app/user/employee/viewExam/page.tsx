"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type UserExamData, type ExamQuestion } from "~/app/data/data";
import { UserContext } from "~/app/UserContext";

export default function ViewExam() {
  const { userExams } = useContext(UserContext);

  const searchParams = useSearchParams();
  const examID = searchParams.get("examID") ?? "";
  const [ exam, setExam ] = useState<UserExamData | null>(null);
  const [ examTitle, setExamTitle ] = useState<string>("Unknown Exam");

  useEffect(() => {
    if (examID) {
      // Find the exam content
      const foundExam = userExams.find(e => e.examID === Number(examID));
      setExam(foundExam ?? null);
      setExamTitle(foundExam?.examTitle ?? "Unknown Exam");
    }
  }, [userExams, examID]);

  const renderQuestion = (question: ExamQuestion, index: number) => {
    switch (question.questionData.type) {
      case "multiple-choice":
        return (
          <div key={question.questionID} className={styles.questionContainer}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>Q{index + 1}</span>
              <span className={`${styles.questionType} ${styles.multipleChoice}`}>Multiple Choice</span>
              <p className={styles.questionText}>{question.questionData.question}</p>
            </div>
            <div className={styles.optionsContainer}>
              {["A", "B", "C", "D"].map((option, index) => (
                <label key={option} className={styles.optionLabel}>
                  <input type="radio" name={`q${question.questionID}`} value={option} className={styles.radio} />
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                  <span className={styles.optionText}>{option}. {question.questionData.type === 'multiple-choice' ? index < question.questionData.options.length ? question.questionData.options[index] : `Option ${option}` : `Option ${option}`}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case "short-answer":
        return (
          <div key={question.questionID} className={styles.questionContainer}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>Q{index + 1}</span>
              <span className={`${styles.questionType} ${styles.shortAnswer}`}>Short Answer</span>
              <p className={styles.questionText}>{question.questionData.question}</p>
            </div>
            {question.questionData.wordLimit && (
              <p className={styles.wordLimit}>Word Limit: {question.questionData.wordLimit} words</p>
            )}
            <textarea
              className={styles.textarea}
              placeholder="Enter your answer here..."
              maxLength={question.questionData.wordLimit ? question.questionData.wordLimit * 6 : undefined}
            />
          </div>
        );
      case "paragraph":
        return (
          <div key={question.questionID} className={styles.questionContainer}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>Q{index + 1}</span>
              <span className={`${styles.questionType} ${styles.paragraph}`}>Essay</span>
              <p className={styles.questionText}>{question.questionData.question}</p>
            </div>
            {question.questionData.wordLimit && (
              <p className={styles.wordLimit}>Word Limit: {question.questionData.wordLimit} words</p>
            )}
            <textarea
              className={`${styles.textarea} ${styles.paragraphTextarea}`}
              placeholder="Write your essay here..."
              maxLength={question.questionData.wordLimit ? question.questionData.wordLimit * 6 : undefined}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <Nav scope="employee" />
      <main className={`${styles.main} ${sharedStyles.main} main`}>
        <div className={styles.examHeader}>
          <h1 className={styles.examTitle}>{examTitle}</h1>
          <p className={styles.examInfo}>View exam details and questions below</p>
        </div>
        {exam ? (
          <div className={styles.questionsSection}>
            {exam.questions?.map((question, index) => renderQuestion(question, index))}
          </div>
        ) : (
          <p className={styles.noContent}>No exam content found.</p>
        )}
      </main>
    </div>
  );
}