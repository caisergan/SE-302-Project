import db from '../database/db';
import { Student } from '../../types';

interface IdResult { id: number; }
export interface StudentWithCourses extends Student { enrolled_courses: string[]; }

export const getStudents = (): StudentWithCourses[] => {
    try {
        const studentsStmt = db.prepare('SELECT id, student_number, name, email FROM students');
        const coursesStmt = db.prepare(`SELECT c.code FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.student_id = ?`);
        return (studentsStmt.all() as any[]).map(s => ({
            ...s, studentNumber: s.student_number,
            enrolled_courses: (coursesStmt.all(s.id) as { code: string }[]).map(c => c.code)
        }));
    } catch (e) { console.error(e); return []; }
};

export const addStudentsBulk = (students: any[]): void => {
    const insertStudent = db.prepare('INSERT OR IGNORE INTO students (student_number, name, email) VALUES (@studentNumber, @name, @email)');
    const getStudentId = db.prepare('SELECT id FROM students WHERE student_number = ?');
    const insertCourse = db.prepare('INSERT OR IGNORE INTO courses (code, name, enrolled_students) VALUES (?, ?, 0)');
    const getCourseId = db.prepare('SELECT id FROM courses WHERE code = ? COLLATE NOCASE');
    const insertEnrollment = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

    db.transaction((list) => {
        for (const s of list) {
            if (!s.studentNumber) continue;
            insertStudent.run({ studentNumber: s.studentNumber, name: s.name, email: s.email || `${s.studentNumber}@uni.edu` });
            
            const stdRecord = getStudentId.get(s.studentNumber) as IdResult;
            if (!stdRecord) continue;

            if (s.enrolledCourses?.length) {
                for (const code of s.enrolledCourses) {
                    insertCourse.run(code, code);
                    const crsRecord = getCourseId.get(code) as IdResult;
                    if(crsRecord) insertEnrollment.run(crsRecord.id, stdRecord.id);
                }
            }
        }
    })(students);
};

export const addEnrollmentsBulk = (enrollments: { studentNumber: string; courseCode: string }[]): void => {
    const insertStudent = db.prepare('INSERT OR IGNORE INTO students (student_number, name, email) VALUES (?, ?, ?)');
    const insertCourse = db.prepare('INSERT OR IGNORE INTO courses (code, name, enrolled_students) VALUES (?, ?, 0)');
    const getStudentId = db.prepare('SELECT id FROM students WHERE student_number = ?');
    const getCourseId = db.prepare('SELECT id FROM courses WHERE code = ? COLLATE NOCASE');
    const insertEnrollment = db.prepare('INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

    db.transaction((list) => {
        for (const item of list) {
            const sNum = item.studentNumber.trim();
            const cCode = item.courseCode.trim();
            insertStudent.run(sNum, `Student ${sNum}`, `${sNum.toLowerCase()}@uni.edu`);
            insertCourse.run(cCode, cCode);
            
            const sId = (getStudentId.get(sNum) as IdResult)?.id;
            const cId = (getCourseId.get(cCode) as IdResult)?.id;
            if (sId && cId) insertEnrollment.run(cId, sId);
        }
    })(enrollments);
};

export const updateStudent = (id: number, name: string) => db.prepare('UPDATE students SET name = ? WHERE id = ?').run(name, id);
export const deleteStudent = (id: number) => db.prepare('DELETE FROM students WHERE id = ?').run(id);
export const clearStudents = () => { db.prepare('DELETE FROM enrollments').run(); db.prepare('DELETE FROM students').run(); };