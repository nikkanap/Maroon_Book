"use client";

import sharedStyles from "~/app/user/components/shared.module.css";
import styles from "./page.module.css";
import Nav from "~/app/user/components/userNav";
import { useContext, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { type UserExamData, type ExamQuestion } from "~/app/data/data";
import { UserContext } from "~/app/UserContext";
import { api } from "~/trpc/client";

export default function ViewExam() {
  const { userExams, baseUser } = useContext(UserContext);
  const router = useRouter();

  const searchParams = useSearchParams();
  const examID = searchParams.get("examID") ?? "";
  const [ exam, setExam ] = useState<UserExamData | null>(null);
  const [ examTitle, setExamTitle ] = useState<string>("Unknown Exam");
  const [ answers, setAnswers ] = useState<Map<number, string>>(new Map());
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ submitError, setSubmitError ] = useState<string | null>(null);

  useEffect(() => {
    if (examID) {
      // Find the exam content
      const foundExam = userExams.find(e => e.examID === Number(examID));
      setExam(foundExam ?? null);
      setExamTitle(foundExam?.examTitle ?? "Unknown Exam");
    }
  }, [userExams, examID]);

  const updateAnswer = (questionID: number, answer: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionID, answer);
      return newAnswers;
    });
  };

  const isExamAlreadySubmitted = exam && exam.scores && exam.scores.length > 0 && baseUser && exam.scores.some(score => score.studentID === baseUser.id);

  const allQuestionsAnswered = exam && exam.questions && answers.size === exam.questions.length;

  const handleSubmit = async () => {
    if (!exam || !baseUser || !allQuestionsAnswered) {
      setSubmitError("Please answer all questions before submitting.");
      return;
    }

    // Get sectionID from the exam's assigned data
    const sectionIDFromExam = exam.assigned?.[0]?.sectionID;
    if (!sectionIDFromExam) {
      setSubmitError("Unable to determine your section. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert answers map to array format expected by API
      const answersArray = exam.questions!.map(question => ({
        questionID: question.questionID,
        answerData: answers.get(question.questionID) || "",
      }));

      const result = await api.user.submitExam.mutate({
        token: baseUser.authToken,
        examID: Number(examID),
        sectionID: sectionIDFromExam,
        answers: answersArray,
      });

      if (result.status === "ok") {
        // Redirect to student page or show success message
        router.push("/user/student");
      } else {
        setSubmitError(result.message || "Failed to submit exam");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      setSubmitError("An error occurred while submitting the exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <input 
                    type="radio" 
                    name={`q${question.questionID}`} 
                    value={option} 
                    className={styles.radio}
                    checked={answers.get(question.questionID) === option}
                    onChange={(e) => updateAnswer(question.questionID, e.target.value)}
                  />
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
              value={answers.get(question.questionID) || ""}
              onChange={(e) => updateAnswer(question.questionID, e.target.value)}
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
              value={answers.get(question.questionID) || ""}
              onChange={(e) => updateAnswer(question.questionID, e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <Nav scope="student" />
      <main className={`${styles.main} ${sharedStyles.main} main`}>
        <div className={styles.examHeader}>
          <h1 className={styles.examTitle}>{examTitle}</h1>
        </div>
        {exam ? (
          <div className={styles.examContent}>
            {isExamAlreadySubmitted ? (
              <div className={styles.submittedSection}>
                <div className={styles.submittedMessage}>
                  <p className={styles.submittedText}>✓ You have already submitted this exam</p>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.questionsSection}>
                  {exam.questions?.map((question, index) => renderQuestion(question, index))}
                </div>
                <div className={styles.submitSection}>
                  {submitError && (
                    <div className={styles.errorMessage}>{submitError}</div>
                  )}
                  <button
                    className={`${styles.submitButton} ${!allQuestionsAnswered ? styles.disabled : ""}`}
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Exam"}
                  </button>
                  {!allQuestionsAnswered && (
                    <p className={styles.helperText}>
                      Please answer all {exam.questions?.length ?? 0} question(s) to submit
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className={styles.noContent}>No exam content found.</p>
        )}
      </main>
    </div>
  );
}