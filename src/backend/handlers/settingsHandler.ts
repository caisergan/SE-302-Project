import { ipcMain, shell } from 'electron';
import { dbPath } from '../database/db';

export const registerSettingsHandlers = () => {
    ipcMain.handle('get-db-path', () => {
        return dbPath;
    });

    ipcMain.handle('open-db-location', () => {
        shell.showItemInFolder(dbPath);
    });
};
