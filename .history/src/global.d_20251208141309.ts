// src/global.d.ts

export {};

declare global {
  interface Window {
    api: {
      // Courses
      getCourses: () => Promise<any[]>;
      addCourse: (course: any) => Promise<any>;
      updateCourse: (course: any) => Promise<void>;
      deleteCourse: (id: number) => Promise<void>;
      addCoursesBulk: (courses: any[]) => Promise<void>;
      clearCourses: () => Promise<void>;

      // Classrooms
      getClassrooms: () => Promise<any[]>;
      addClassroomsBulk: (classrooms: any[]) => Promise<void>;
      updateClassroom: (room: any) => Promise<void>;
      deleteClassroom: (id: number) => Promise<void>;
      clearClassrooms: () => Promise<void>;

      // Students
      getStudents: () => Promise<any[]>;
      addStudentsBulk: (students: any[]) => Promise<void>;
      updateStudent: (student: any) => Promise<void>;
      deleteStudent: (id: number) => Promise<void>;
      clearStudents: () => Promise<void>;
    };
  }
}