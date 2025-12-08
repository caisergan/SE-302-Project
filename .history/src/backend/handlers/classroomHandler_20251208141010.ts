import { ipcMain } from 'electron';
import * as classroomService from '../services/classroomService';

export const registerClassroomHandlers = () => {
    ipcMain.handle('get-classrooms', () => classroomService.getClassrooms());
    ipcMain.handle('add-classrooms-bulk', (_, classrooms) => classroomService.addClassroomsBulk(classrooms));
    ipcMain.handle('clear-classrooms', () => classroomService.clearClassrooms());
    
    // YENİ: Update ve Delete handlerları
    ipcMain.handle('update-classroom', (_, room) => classroomService.updateClassroom(room.id, room.name, room.capacity, room.building));
    ipcMain.handle('delete-classroom', (_, id) => classroomService.deleteClassroom(id));
};