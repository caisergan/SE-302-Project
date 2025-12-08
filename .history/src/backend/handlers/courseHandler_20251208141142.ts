import { ipcMain } from 'electron';
import * as courseService from '../services/courseService';

export const registerCourseHandlers = () => {
    ipcMain.handle('get-courses', () => {
        return courseService.getCourses();
    });

    ipcMain.handle('add-course', (_, course: { code: string; name: string; enrolledStudents: number }) => {
        return courseService.addCourse(course.code, course.name, course.enrolledStudents);
    });

    // YENİ EKLENENLER: Update ve Delete
    ipcMain.handle('update-course', (_, course: { id: number; code: string; name: string }) => {
        return courseService.updateCourse(course.id, course.code, course.name);
    });

    ipcMain.handle('delete-course', (_, id: number) => {
        return courseService.deleteCourse(id);
    });
    // ---------------------------------

    ipcMain.handle('add-courses-bulk', (_, courses: { code: string; name: string; enrolledStudents: number }[]) => {
        return courseService.addCoursesBulk(courses);
    });

    ipcMain.handle('clear-courses', () => {
        return courseService.clearCourses();
    });
};