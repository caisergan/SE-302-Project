import { ipcMain } from 'electron';
import * as classroomService from '../services/classroomService';

export const registerClassroomHandlers = () => {
    ipcMain.handle('get-classrooms', () => {
        return classroomService.getClassrooms();
    });

    ipcMain.handle('add-classrooms-bulk', (_, classrooms: { name: string; capacity: number; building: string }[]) => {
        // Now this handler will only add new classrooms without clearing existing ones.
        return classroomService.addClassroomsBulk(classrooms);
    });

    ipcMain.handle('clear-classrooms', () => {
        return classroomService.clearClassrooms();
    });
};
