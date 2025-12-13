import { ipcMain } from 'electron';
import * as studentService from '../services/studentService';

export const registerStudentHandlers = () => {
    
    // Temizlik: Önceki handler'ları sil
    ipcMain.removeHandler('get-students');
    ipcMain.removeHandler('add-students-bulk');
    ipcMain.removeHandler('update-student');
    ipcMain.removeHandler('delete-student');
    ipcMain.removeHandler('clear-students');
    ipcMain.removeHandler('add-enrollments-bulk');

    // Kayıt: Yenileri ekle
    ipcMain.handle('get-students', () => studentService.getStudents());
    
    // BURASI ÖNEMLİ: Bulk işlemi try-catch içine alındı
    ipcMain.handle('add-students-bulk', async (_, students) => {
        try {
            return studentService.addStudentsBulk(students);
        } catch (error) {
            console.error("Bulk Import Error (Handler):", error);
            throw error; // Hatayı Frontend'e fırlat ki kullanıcı görsün
        }
    });

    ipcMain.handle('update-student', (_, s) => studentService.updateStudent(Number(s.id), s.name));
    ipcMain.handle('delete-student', (_, id) => studentService.deleteStudent(Number(id)));
    ipcMain.handle('clear-students', () => studentService.clearStudents());
    ipcMain.handle('add-enrollments-bulk', (_, data) => studentService.addEnrollmentsBulk(data));
};