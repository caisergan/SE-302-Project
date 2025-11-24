import { Course, Classroom, Student } from '../types';

export const MOCK_COURSES: Course[] = [
  { id: 'c1', code: 'CS101', name: 'Intro to Computer Science', enrolledStudents: 120 },
  { id: 'c2', code: 'MATH201', name: 'Calculus II', enrolledStudents: 85 },
  { id: 'c3', code: 'PHY101', name: 'Physics I', enrolledStudents: 60 },
  { id: 'c4', code: 'ENG102', name: 'English Composition', enrolledStudents: 45 },
  { id: 'c5', code: 'CHEM101', name: 'General Chemistry', enrolledStudents: 90 },
  { id: 'c6', code: 'CS301', name: 'Data Structures', enrolledStudents: 110 },
  { id: 'c7', code: 'HIST101', name: 'World History', enrolledStudents: 150 },
  { id: 'c8', code: 'ART101', name: 'Art Appreciation', enrolledStudents: 200 },
];

export const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'r1', name: 'Auditorium A', capacity: 300, building: 'Main Hall' },
  { id: 'r2', name: 'Room 101', capacity: 50, building: 'Science Wing' },
  { id: 'r3', name: 'Room 102', capacity: 50, building: 'Science Wing' },
  { id: 'r4', name: 'Lecture Hall B', capacity: 150, building: 'Main Hall' },
  { id: 'r5', name: 'Lab 3', capacity: 30, building: 'Tech Center' },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice@uni.edu', enrolledCourses: ['c1', 'c2'] },
  { id: 's2', name: 'Bob Smith', email: 'bob@uni.edu', enrolledCourses: ['c1', 'c3'] },
  { id: 's3', name: 'Charlie Brown', email: 'charlie@uni.edu', enrolledCourses: ['c2', 'c4', 'c5'] },
];
