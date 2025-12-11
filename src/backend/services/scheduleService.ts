import db from '../database/db';
import { dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface ExamSessionDB {
    id: number;
    session_id: string;
    course_code: string;
    classroom_name: string;
    start_time: string;
    end_time: string;
    created_at: string;
}

export interface ExamSessionInput {
    sessionId: string;
    courseCode: string;
    classroomName: string;
    startTime: string;
    endTime: string;
}

/**
 * Saves a generated schedule to the database.
 * Clears any existing schedule before saving.
 */
export const saveSchedule = (sessions: ExamSessionInput[]): void => {
    // Clear existing schedule
    db.prepare('DELETE FROM exam_sessions').run();

    // Insert new sessions
    const insert = db.prepare(`
        INSERT INTO exam_sessions (session_id, course_code, classroom_name, start_time, end_time)
        VALUES (@sessionId, @courseCode, @classroomName, @startTime, @endTime)
    `);

    const insertMany = db.transaction((sessionsList: ExamSessionInput[]) => {
        for (const session of sessionsList) {
            insert.run(session);
        }
    });

    insertMany(sessions);
};

/**
 * Loads the saved schedule from the database.
 */
export const loadSchedule = (): ExamSessionDB[] => {
    const stmt = db.prepare('SELECT * FROM exam_sessions ORDER BY start_time');
    return stmt.all() as ExamSessionDB[];
};

/**
 * Clears the saved schedule from the database.
 */
export const clearSchedule = (): void => {
    db.prepare('DELETE FROM exam_sessions').run();
};

/**
 * Checks if a saved schedule exists.
 */
export const hasSchedule = (): boolean => {
    const result = db.prepare('SELECT COUNT(*) as count FROM exam_sessions').get() as { count: number };
    return result.count > 0;
};

/**
 * Exports the schedule to a CSV file.
 * Opens a save dialog and writes the file.
 */
export const exportScheduleToCSV = async (
    sessions: ExamSessionInput[],
    courses: { id: string; code: string; name: string }[],
    classrooms: { id: string; name: string }[]
): Promise<{ success: boolean; filePath?: string; message: string }> => {
    try {
        // Create course and classroom lookup maps
        const courseMap = new Map(courses.map(c => [c.id, c]));
        const classroomMap = new Map(classrooms.map(c => [c.id, c]));

        // Build CSV content
        const headers = ['Exam ID', 'Course Code', 'Course Name', 'Classroom', 'Date', 'Start Time', 'End Time'];
        const rows = sessions.map(session => {
            const course = courseMap.get(session.courseCode);
            const classroom = classroomMap.get(session.classroomName);
            const startDate = new Date(session.startTime);
            const endDate = new Date(session.endTime);

            return [
                session.sessionId,
                course?.code || session.courseCode,
                course?.name || 'Unknown',
                classroom?.name || session.classroomName,
                startDate.toLocaleDateString('en-US'),
                startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            ];
        });

        // Escape CSV fields
        const escapeCSV = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Export Schedule',
            defaultPath: path.join(app.getPath('documents'), `exam-schedule-${new Date().toISOString().split('T')[0]}.csv`),
            filters: [
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (result.canceled || !result.filePath) {
            return { success: false, message: 'Export cancelled by user.' };
        }

        // Write file
        fs.writeFileSync(result.filePath, csvContent, 'utf-8');

        return {
            success: true,
            filePath: result.filePath,
            message: `Successfully exported ${sessions.length} exam sessions.`
        };
    } catch (error) {
        return {
            success: false,
            message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};
