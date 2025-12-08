import { ipcMain } from 'electron';
import * as studentService from '../services/studentService';

export const registerStudentHandlers = () => {
    ipcMain.handle('get-students', () => studentService.getStudents());
    ipcMain.handle('add-students-bulk', (_, students) => studentService.addStudentsBulk(students));
    ipcMain.handle('clear-students', () => studentService.clearStudents());

    // YENİ: Update ve Delete
    ipcMain.handle('update-student', (_, student) => studentService.updateStudent(student.id, student.name));
    ipcMain.handle('delete-student', (_, id) => studentService.deleteStudent(id));
};