// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // --- Courses ---
    getCourses: () => ipcRenderer.invoke('get-courses'),
    addCourse: (course: any) => ipcRenderer.invoke('add-course', course),
    updateCourse: (course: any) => ipcRenderer.invoke('update-course', course),
    deleteCourse: (id: number) => ipcRenderer.invoke('delete-course', id),
    addCoursesBulk: (courses: any[]) => ipcRenderer.invoke('add-courses-bulk', courses),
    clearCourses: () => ipcRenderer.invoke('clear-courses'),

    // --- Classrooms ---
    getClassrooms: () => ipcRenderer.invoke('get-classrooms'),
    // Eksik olan kısımlar buradaydı:
    addClassroomsBulk: (classrooms: any[]) => ipcRenderer.invoke('add-classrooms-bulk', classrooms),
    updateClassroom: (room: any) => ipcRenderer.invoke('update-classroom', room),
    deleteClassroom: (id: number) => ipcRenderer.invoke('delete-classroom', id),
    clearClassrooms: () => ipcRenderer.invoke('clear-classrooms'),

    // --- Students ---
    getStudents: () => ipcRenderer.invoke('get-students'),
    addStudentsBulk: (students: any[]) => ipcRenderer.invoke('add-students-bulk', students),
    updateStudent: (student: any) => ipcRenderer.invoke('update-student', student),
    deleteStudent: (id: number) => ipcRenderer.invoke('delete-student', id),
    clearStudents: () => ipcRenderer.invoke('clear-students'),
});