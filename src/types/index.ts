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
  id: string;
  name: string;
  studentNumber : string;
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
