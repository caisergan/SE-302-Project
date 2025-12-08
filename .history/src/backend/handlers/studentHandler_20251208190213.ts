import { ipcMain } from 'electron';
import * as studentService from '../services/studentService';

export const registerStudentHandlers = () => {
    ipcMain.handle('get-students', () => {
        return studentService.getStudents();
    });

    ipcMain.handle('add-students-bulk', (_, students) => {
        return studentService.addStudentsBulk(students);
    });

    // --- DÜZELTME BURADA YAPILDI ---
    ipcMain.handle('update-student', (_, student) => {
        // Frontend'den ID string ("5") gelebilir, onu Number'a (5) çeviriyoruz.
        // Ayrıca name'in boş olmadığından emin oluyoruz.
        const id = Number(student.id);
        const name = student.name;

        if (isNaN(id)) {
            throw new Error("Invalid Student ID");
        }

        return studentService.updateStudent(id, name);
    });
    // -------------------------------

    ipcMain.handle('delete-student', (_, id) => {
        return studentService.deleteStudent(Number(id)); // Silme işleminde de Number() yapmak güvenlidir
    });

    ipcMain.handle('clear-students', () => {
        return studentService.clearStudents();
    });
};