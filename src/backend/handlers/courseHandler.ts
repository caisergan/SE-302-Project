import { ipcMain } from 'electron';
import * as courseService from '../services/courseService';

export const registerCourseHandlers = () => {
    ipcMain.handle('get-courses', () => {
        return courseService.getCourses();
    });

    ipcMain.handle('add-course', (_, course: { code: string; name: string; enrolledStudents: number }) => {
        return courseService.addCourse(course.code, course.name, course.enrolledStudents);
    });
};
