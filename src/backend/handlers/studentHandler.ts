import { ipcMain } from 'electron';
import * as studentService from '../services/studentService';

export const registerStudentHandlers = () => {
    ipcMain.handle('get-students', () => {
        return studentService.getStudents();
    });

    ipcMain.handle('add-students-bulk', (_, students: { studentNumber: string; name: string; enrolledCourses: string[] }[]) => {
        return studentService.addStudentsBulk(students);
    });

    ipcMain.handle('clear-students', () => {
        return studentService.clearStudents();
    });
};
