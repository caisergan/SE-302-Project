declare module '*.png';
declare module '*.ico';
declare module '*.svg';

interface ScheduleResult {
    success: boolean;
    schedule: any[];
    message: string;
    stats?: {
        totalCourses: number;
        scheduledCourses: number;
        totalTimeSlots: number;
        totalClassrooms: number;
        generationTimeMs: number;
    };
}

interface ValidationResult {
    valid: boolean;
    violations: string[];
}

interface LoadScheduleResult {
    success: boolean;
    sessions: any[];
    message?: string;
}

interface ExportResult {
    success: boolean;
    filePath?: string;
    message: string;
}

declare global {
    interface Window {
        api: {
            getCourses: () => Promise<any[]>;
            addCourse: (course: any) => Promise<number>;
            addCoursesBulk: (courses: any[]) => Promise<void>;
            clearCourses: () => Promise<void>;

            getClassrooms: () => Promise<any[]>;
            addClassroomsBulk: (classrooms: any[]) => Promise<void>;
            clearClassrooms: () => Promise<void>;

            getStudents: () => Promise<any[]>;
            addStudentsBulk: (students: any[]) => Promise<void>;
            clearStudents: () => Promise<void>;

            // Scheduler API
            generateSchedule: (constraints: any) => Promise<ScheduleResult>;
            validateSchedule: (schedule: any[]) => Promise<ValidationResult>;

            // Schedule Persistence & Export API
            saveSchedule: (sessions: any[]) => Promise<{ success: boolean; message: string }>;
            loadSchedule: () => Promise<LoadScheduleResult>;
            hasSchedule: () => Promise<boolean>;
            clearSchedule: () => Promise<{ success: boolean }>;
            exportScheduleCSV: (data: any) => Promise<ExportResult>;
        };
    }
}


