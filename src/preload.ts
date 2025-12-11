import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getCourses: () => ipcRenderer.invoke('get-courses'),
    addCourse: (course: any) => ipcRenderer.invoke('add-course', course),
    addCoursesBulk: (courses: any[]) => ipcRenderer.invoke('add-courses-bulk', courses),
    clearCourses: () => ipcRenderer.invoke('clear-courses'),

    getClassrooms: () => ipcRenderer.invoke('get-classrooms'),
    addClassroomsBulk: (classrooms: any[]) => ipcRenderer.invoke('add-classrooms-bulk', classrooms),
    clearClassrooms: () => ipcRenderer.invoke('clear-classrooms'),

    getStudents: () => ipcRenderer.invoke('get-students'),
    addStudentsBulk: (students: any[]) => ipcRenderer.invoke('add-students-bulk', students),
    clearStudents: () => ipcRenderer.invoke('clear-students'),

    // Scheduler API
    generateSchedule: (constraints: any) => ipcRenderer.invoke('generate-schedule', constraints),
    validateSchedule: (schedule: any[]) => ipcRenderer.invoke('validate-schedule', schedule),

    // Schedule Persistence & Export API
    saveSchedule: (sessions: any[]) => ipcRenderer.invoke('save-schedule', sessions),
    loadSchedule: () => ipcRenderer.invoke('load-schedule'),
    hasSchedule: () => ipcRenderer.invoke('has-schedule'),
    clearSchedule: () => ipcRenderer.invoke('clear-schedule'),
    exportScheduleCSV: (data: any) => ipcRenderer.invoke('export-schedule-csv', data),
});



