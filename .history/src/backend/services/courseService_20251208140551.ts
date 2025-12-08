import db from '../database/db';

export interface CourseDB {
    id: number;
    code: string;
    name: string;
    enrolled_students: number;
}

export const getCourses = (): CourseDB[] => {
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.code, 
            c.name, 
            COUNT(e.student_id) as enrolled_students 
        FROM courses c 
        LEFT JOIN enrollments e ON c.id = e.course_id 
        GROUP BY c.id
    `);
    return stmt.all() as CourseDB[];
};

export const addCourse = (code: string, name: string, enrolledStudents: number): number | bigint => {
    const stmt = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (?, ?, ?)');
    const info = stmt.run(code, name, enrolledStudents);
    return info.lastInsertRowid;
};

export const updateCourse = (id: number, code: string, name: string): void => {
    const stmt = db.prepare('UPDATE courses SET code = ?, name = ? WHERE id = ?');
    stmt.run(code, name, id);
};

export const deleteCourse = (id: number): void => {
    // Enrollments tablosunda ON DELETE CASCADE olduğu için kayıtlar oradan da silinir
    const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
    stmt.run(id);
};

export const addCoursesBulk = (courses: { code: string; name: string; enrolledStudents: number }[]): void => {
    const insert = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (@code, @name, @enrolledStudents)');
    const insertMany = db.transaction((courses) => {
        for (const course of courses) insert.run(course);
    });
    insertMany(courses);
};

export const clearCourses = (): void => {
    db.prepare('DELETE FROM courses').run();
    db.prepare('DELETE FROM enrollments').run();
};