export enum ViewMode {
  DASHBOARD = 'Dashboard',
  DATA = 'Data Management',
  SCHEDULE = 'Schedule View',
  SETTINGS = 'Settings',
}

export interface GenerationConstraints {
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  dailyStartTime: string; // "09:00"
  dailyEndTime: string;   // "17:00"
  maxExamsPerDay: number; // Maximum exams per student per day (default: 2)
  allowConsecutiveExams: boolean; // Allow back-to-back exams (default: true)
  minHoursBetweenExams: number; // Minimum hours between exams for a student (default: 1)
}

export interface Course {
  id: string;
  code: string;
  name: string;
  enrolledStudents: number;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  building: string;
}

export interface Student {
  id:string;
  name: string;
  email: string;
  enrolledCourses: string[]; // Array of Course IDs
}

export interface ExamSession {
  id: string;
  courseId: string;
  classroomId: string;
  startTime: Date;
  endTime: Date;
  studentCount?: number;
}

export interface DataContextType {
  courses: Course[];
  classrooms: Classroom[];
  students: Student[];
}

/**
 * Represents an exam session that has been processed for UI display.
 * It may be a single session or a combination of multiple sessions for a split exam.
 */
export interface DisplaySession extends ExamSession {
  isSplit?: boolean;
  classroomList?: { name: string; count: number }[]; // List of classrooms for a split exam
  totalStudents?: number;
}