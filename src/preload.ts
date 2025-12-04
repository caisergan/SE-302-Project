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
});

