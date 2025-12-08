import db from '../database/db';

export interface StudentWithCourses {
    id: number;
    student_number: string;
    name: string;
    enrolled_courses: string[];
}

export const getStudents = (): StudentWithCourses[] => {
    // Mevcut getStudents kodunuzu koruyun, sadece bu eklemeleri yapın:
    const studentsStmt = db.prepare('SELECT * FROM students');
    const students = studentsStmt.all() as any[];

    const enrollmentsStmt = db.prepare(`SELECT e.student_id, c.code FROM enrollments e JOIN courses c ON e.course_id = c.id`);
    const enrollments = enrollmentsStmt.all() as any[];

    const studentMap = new Map<number, StudentWithCourses>();
    students.forEach(s => studentMap.set(s.id, { id: s.id, student_number: s.student_number, name: s.name, enrolled_courses: [] }));
    enrollments.forEach(e => studentMap.get(e.student_id)?.enrolled_courses.push(e.code));

    return Array.from(studentMap.values());
};

export const addStudentsBulk = (students: any[]): void => {
    // Mevcut bulk ekleme kodunu koruyun (Transaction yapısını)
    const insertStudent = db.prepare('INSERT OR IGNORE INTO students (student_number, name) VALUES (@studentNumber, @name)');
    const getStudentId = db.prepare('SELECT id FROM students WHERE student_number = ?');
    const getCourseId = db.prepare('SELECT id FROM courses WHERE code = ?');
    const insertEnrollment = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

    const transaction = db.transaction((studentsList) => {
        for (const s of studentsList) {
            insertStudent.run({ studentNumber: s.studentNumber, name: s.name });
            const studentIdResult = getStudentId.get(s.studentNumber) as { id: number } | undefined;
            if (!studentIdResult) continue;
            for (const code of s.enrolledCourses) {
                const courseRes = getCourseId.get(code) as { id: number } | undefined;
                if (courseRes) insertEnrollment.run(courseRes.id, studentIdResult.id);
            }
        }
    });
    transaction(students);
};

export const updateStudent = (id: number, name: string): void => {
    db.prepare('UPDATE students SET name = ? WHERE id = ?').run(name, id);
};

export const deleteStudent = (id: number): void => {
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    // Enrollments CASCADE ile silinir
};

export const clearStudents = (): void => {
    db.prepare('DELETE FROM students').run();
};
// src/backend/services/studentService.ts dosyasının en altına ekle:

export const addEnrollmentsBulk = (enrollments: { studentNumber: string; courseCode: string }[]): void => {
    const getStudentId = db.prepare('SELECT id FROM students WHERE student_number = ?');
    const getCourseId = db.prepare('SELECT id FROM courses WHERE code = ? COLLATE NOCASE');
    const insertEnrollment = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

    const transaction = db.transaction((list) => {
        for (const item of list) {
            const student = getStudentId.get(item.studentNumber) as { id: number } | undefined;
            const course = getCourseId.get(item.courseCode) as { id: number } | undefined;

            if (student && course) {
                insertEnrollment.run(course.id, student.id);
            }
        }
    });

    transaction(enrollments);
};