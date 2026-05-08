import { type ReferenceExam, type Course } from "~/app/data/data";

export interface ExamStatistics {
  totalTakers: number;
  averageScore: number;
}

export interface StudentScore {
  examScoreID: string;
  studentNo: string;
  score: number;
  totalItems: number;
  percentage: number;
}

/**
 * Loads exam and course data from URL parameters
 */
export function loadExamData(examID: string, courseID: string): {
  exam: ReferenceExam | null;
  course: Course | null;
} {
  const foundCourse = courses.find((course: Course) => course.courseID === courseID);
  const foundExam = referenceExams.find((exam: ReferenceExam) => exam.examID === examID);

  return {
    exam: foundExam ?? null,
    course: foundCourse ?? null,
  };
}

/**
 * Calculates exam statistics (total takers and average score)
 */
export function calculateExamStatistics(examID: string, totalItems: number): ExamStatistics {
  const examScoresForExam = examScores.filter((score) => score.referencedExamID === examID);
  const totalTakers = examScoresForExam.length;
  const totalScore = examScoresForExam.reduce((sum, score) => sum + score.score, 0);
  const averageScore = totalTakers > 0 ? (totalScore / totalTakers / totalItems) * 100 : 0;

  return { totalTakers, averageScore };
}

/**
 * Gets student performance data for a specific exam
 */
export function getStudentPerformanceData(examID: string, totalItems: number): StudentScore[] {
  const scoreData = examScores
    .filter((score) => score.referencedExamID === examID)
    .map((score) => {
      const student = students.find((s) => s.userID === score.studentID);
      if (!student) return null;

      const percentage = parseFloat(((score.score / totalItems) * 100).toFixed(2));
      return {
        examScoreID: score.examScoreID,
        studentNo: student.studentNo,
        score: score.score,
        totalItems: totalItems,
        percentage: percentage,
      };
    })
    .filter((item): item is StudentScore => item !== null);

  return scoreData;
}

/**
 * Formats exam details for display
 */
export function formatExamDetails(exam: ReferenceExam) {
  return {
    title: exam.examTitle,
    type: exam.examType,
    items: exam.items,
    timeAllotted: exam.timeAllotted,
    dueDate: exam.dueDate,
    sections: exam.sections.map((section) => `Section ${section}`),
  };
}

/**
 * Validates that both exam and course data are available
 */
export function isDataReady(exam: ReferenceExam | null, course: Course | null): boolean {
  return exam !== null && course !== null;
}
