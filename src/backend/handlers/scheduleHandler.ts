import { ipcMain } from 'electron';
import * as scheduleService from '../services/scheduleService';

export const registerScheduleHandlers = () => {
    /**
     * Save a schedule to the database
     */
    ipcMain.handle('save-schedule', async (_, sessions: scheduleService.ExamSessionInput[]) => {
        try {
            scheduleService.saveSchedule(sessions);
            return { success: true, message: 'Schedule saved successfully.' };
        } catch (error) {
            return {
                success: false,
                message: `Failed to save schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });

    /**
     * Load a saved schedule from the database
     */
    ipcMain.handle('load-schedule', async () => {
        try {
            const sessions = scheduleService.loadSchedule();
            return { success: true, sessions };
        } catch (error) {
            return {
                success: false,
                sessions: [],
                message: `Failed to load schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });

    /**
     * Check if a saved schedule exists
     */
    ipcMain.handle('has-schedule', async () => {
        try {
            return scheduleService.hasSchedule();
        } catch (error) {
            return false;
        }
    });

    /**
     * Clear the saved schedule
     */
    ipcMain.handle('clear-schedule', async () => {
        try {
            scheduleService.clearSchedule();
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    });

    /**
     * Export schedule to CSV file
     */
    ipcMain.handle('export-schedule-csv', async (_, data: {
        sessions: scheduleService.ExamSessionInput[];
        courses: { id: string; code: string; name: string }[];
        classrooms: { id: string; name: string }[];
    }) => {
        return scheduleService.exportScheduleToCSV(data.sessions, data.courses, data.classrooms);
    });
};
