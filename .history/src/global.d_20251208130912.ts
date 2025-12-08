export { };

declare global {
    interface Window {
        api: {
            getCourses: () => Promise<any[]>;
            addCourse: (course: any) => Promise<number>;
            addCoursesBulk: (courses: any[]) => Promise<void>;
            clearCourses: () => Promise<void>;

            getClassrooms: () => Promise<any[]>;
            addClassroomsBulk: (classrooms: any[]) => Promise<void>;
            clearClassrooms: () => Promise<void>;

            getStudents: () => Promise<any[]>;
            addStudentsBulk: (students: any[]) => Promise<void>;
            clearStudents: () => Promise<void>;
        };
    }
}
