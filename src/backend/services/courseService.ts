import db from '../database/db';

export interface CourseDB {
    id: number;
    code: string;
    name: string;
    enrolled_students: number;
}

export const getCourses = (): CourseDB[] => {
    const stmt = db.prepare('SELECT * FROM courses');
    return stmt.all() as CourseDB[];
};

export const addCourse = (code: string, name: string, enrolledStudents: number): number | bigint => {
    const stmt = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (?, ?, ?)');
    const info = stmt.run(code, name, enrolledStudents);
    return info.lastInsertRowid;
};

export const enrollStudent = (courseId: number, studentId: number): void => {
    const stmt = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');
    stmt.run(courseId, studentId);
};
