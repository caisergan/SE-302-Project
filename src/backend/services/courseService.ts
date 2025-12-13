import db from '../database/db';

interface CourseIdResult { id: number; }

export const getCourses = (): any[] => {
    // Canlı Sayım Sorgusu (0 görünme sorununu çözer)
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.code, 
            c.name, 
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_students 
        FROM courses c
    `);
    return stmt.all();
};

export const addCourse = (course: any) => {
    const check = db.prepare('SELECT id FROM courses WHERE code = ? COLLATE NOCASE').get(course.code) as CourseIdResult | undefined;
    
    if (check) {
        const update = db.prepare('UPDATE courses SET name = @name WHERE id = @id');
        return update.run({ name: course.name, id: check.id });
    } else {
        const insert = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (@code, @name, 0)');
        return insert.run(course);
    }
};

export const addCoursesBulk = (courses: any[]) => {
    const checkStmt = db.prepare('SELECT id FROM courses WHERE code = ? COLLATE NOCASE');
    const updateStmt = db.prepare('UPDATE courses SET name = @name WHERE id = @id');
    const insertStmt = db.prepare('INSERT INTO courses (code, name, enrolled_students) VALUES (@code, @name, 0)');

    const transaction = db.transaction((list) => {
        for (const course of list) {
            const existing = checkStmt.get(course.code) as CourseIdResult | undefined;
            if (existing) {
                // Ders zaten (Attendance ile) oluşmuşsa, şimdi gelen gerçek ismiyle güncelle
                updateStmt.run({ name: course.name, id: existing.id });
            } else {
                insertStmt.run(course);
            }
        }
    });
    transaction(courses);
};

export const updateCourse = (course: any) => {
    const stmt = db.prepare('UPDATE courses SET code = @code, name = @name WHERE id = @id');
    return stmt.run(course);
};

export const deleteCourse = (id: number) => {
    const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
    return stmt.run(id);
};

export const clearCourses = () => {
    db.prepare('DELETE FROM enrollments').run();
    db.prepare('DELETE FROM courses').run();
};