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

export const addCoursesBulk = (courses: { code: string; name: string; enrolledStudents: number }[]): void => {
    const insert = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (@code, @name, @enrolledStudents)');
    const insertMany = db.transaction((courses) => {
        for (const course of courses) insert.run(course);
    });
    insertMany(courses);
};

export const clearCourses = (): void => {
    db.prepare('DELETE FROM courses').run();
    // Also clear enrollments as they depend on courses
    db.prepare('DELETE FROM enrollments').run();
};

export const enrollStudent = (courseId: number, studentId: number): void => {
    const insertStmt = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');
    const result = insertStmt.run(courseId, studentId);

    // Update enrolled_students count if a new enrollment was actually inserted
    if (result.changes > 0) {
        db.prepare('UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = ?')
            .run(courseId);
    }
};

/**
 * Sync enrolled_students counts with actual enrollments in the database.
 * Useful for fixing data integrity issues or after bulk imports.
 */
export const syncEnrollmentCounts = (): void => {
    db.prepare(`
        UPDATE courses 
        SET enrolled_students = (
            SELECT COUNT(*) 
            FROM enrollments 
            WHERE enrollments.course_id = courses.id
        )
    `).run();
};

/**
 * Get only courses that have enrolled students.
 * Useful for reducing the problem size when scheduling exams.
 */
export const getActiveCoursesOnly = (): CourseDB[] => {
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.code, 
            c.name, 
            COUNT(e.student_id) as enrolled_students 
        FROM courses c 
        INNER JOIN enrollments e ON c.id = e.course_id 
        GROUP BY c.id
        HAVING COUNT(e.student_id) > 0
    `);
    return stmt.all() as CourseDB[];
};
