import { ipcMain } from 'electron';
import * as classroomService from '../services/classroomService';

export const registerClassroomHandlers = () => {
    ipcMain.handle('get-classrooms', () => {
        return classroomService.getClassrooms();
    });

    ipcMain.handle('add-classrooms-bulk', (_, classrooms: { name: string; capacity: number; building: string }[]) => {
        // Atomically clear existing classrooms and add the new ones
        classroomService.clearClassrooms();
        return classroomService.addClassroomsBulk(classrooms);
    });

    ipcMain.handle('clear-classrooms', () => {
        return classroomService.clearClassrooms();
    });
};
