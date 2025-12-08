import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Courses
    getCourses: () => ipcRenderer.invoke('get-courses'),
    addCourse: (course: any) => ipcRenderer.invoke('add-course', course),
    updateCourse: (course: any) => ipcRenderer.invoke('update-course', course), // YENİ
    deleteCourse: (id: number) => ipcRenderer.invoke('delete-course', id),       // YENİ
    addCoursesBulk: (courses: any[]) => ipcRenderer.invoke('add-courses-bulk', courses),
    clearCourses: () => ipcRenderer.invoke('clear-courses'),

    // Classrooms (Benzer şekilde classroomService ve handler güncellenmeli)
    getClassrooms: () => ipcRenderer.invoke('get-classrooms'),
    addClassroomsBulk: (classrooms: any[]) => ipcRenderer.invoke('add-classrooms-bulk', classrooms),
    clearClassrooms: () => ipcRenderer.invoke('clear-classrooms'),
    // deleteClassroom ve updateClassroom buraya eklenecek...

    // Students
    getStudents: () => ipcRenderer.invoke('get-students'),
    addStudentsBulk: (students: any[]) => ipcRenderer.invoke('add-students-bulk', students),
    deleteStudent: (id: number) => ipcRenderer.invoke('delete-student', id), // YENİ (StudentService'e eklemeniz gerekecek)
    clearStudents: () => ipcRenderer.invoke('clear-students'),
});