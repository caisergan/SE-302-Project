import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getCourses: () => ipcRenderer.invoke('get-courses'),
    addCourse: (course: any) => ipcRenderer.invoke('add-course', course),
});

