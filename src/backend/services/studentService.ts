import db from '../database/db';

export interface StudentDB {
    id: number;
    student_number: string;
    name: string;
}

export interface StudentWithCourses {
    id: number;
    student_number: string;
    name: string;
    enrolled_courses: string[]; // List of course codes
}

export const getStudents = (): StudentWithCourses[] => {
    const studentsStmt = db.prepare('SELECT * FROM students');
    const students = studentsStmt.all() as StudentDB[];

    const enrollmentsStmt = db.prepare(`
        SELECT e.student_id, c.code 
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id
    `);
    const enrollments = enrollmentsStmt.all() as { student_id: number; code: string }[];

    const studentMap = new Map<number, StudentWithCourses>();

    students.forEach(s => {
        studentMap.set(s.id, {
            id: s.id,
            student_number: s.student_number,
            name: s.name,
            enrolled_courses: []
        });
    });

    enrollments.forEach(e => {
        const student = studentMap.get(e.student_id);
        if (student) {
            student.enrolled_courses.push(e.code);
        }
    });

    return Array.from(studentMap.values());
};

export const addStudentsBulk = (students: { studentNumber: string; name: string; enrolledCourses: string[] }[]): void => {
    // We need to handle this carefully.
    // 1. Insert students (ignore if exists, or maybe we should clear first? The user asked for "Import", usually implies adding to or replacing. 
    // The current frontend logic seems to be "add to existing".
    // However, for bulk import, it's often cleaner to assume we might be adding new ones.
    // Let's use INSERT OR IGNORE for students based on student_number.

    const insertStudent = db.prepare('INSERT OR IGNORE INTO students (student_number, name) VALUES (@studentNumber, @name)');
    const getStudentId = db.prepare('SELECT id FROM students WHERE student_number = ?');
    const getCourseId = db.prepare('SELECT id FROM courses WHERE code = ?');
    const insertEnrollment = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

    const transaction = db.transaction((studentsList) => {
        for (const s of studentsList) {
            insertStudent.run({ studentNumber: s.studentNumber, name: s.name });

            const studentIdResult = getStudentId.get(s.studentNumber) as { id: number } | undefined;
            if (!studentIdResult) continue;
            const studentId = studentIdResult.id;

            for (const courseCode of s.enrolledCourses) {
                const courseIdResult = getCourseId.get(courseCode) as { id: number } | undefined;
                if (courseIdResult) {
                    insertEnrollment.run(courseIdResult.id, studentId);
                }
            }
        }
    });

    transaction(students);
};

export const clearStudents = (): void => {
    db.prepare('DELETE FROM students').run();
    // Enrollments will be deleted via CASCADE, but let's be safe or rely on the foreign key.
    // The schema has ON DELETE CASCADE, so we are good.
};
