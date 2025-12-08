import { ipcMain } from 'electron';
import { generateSchedule } from '../algorithm/scheduler';
import * as courseService from '../services/courseService';
import * as classroomService from '../services/classroomService';
import * as studentService from '../services/studentService';
import { GenerationConstraints } from '../../types';

export const registerScheduleHandlers = () => {
    ipcMain.handle('generate-schedule', async (_, constraints: GenerationConstraints) => {
        try {
            // 1. Veritabanından güncel verileri çek
            const coursesDB = courseService.getCourses();
            const classroomsDB = classroomService.getClassrooms();
            const studentsDB = studentService.getStudents();

            // Tipleri Algorithm'in beklediği formata uydur
            const courses = coursesDB.map(c => ({
                id: c.id.toString(),
                code: c.code,
                name: c.name,
                enrolledStudents: c.enrolled_students
            }));

            const classrooms = classroomsDB.map(c => ({
                id: c.id.toString(),
                name: c.name,
                capacity: c.capacity,
                building: c.building || ''
            }));

            // Algoritmayı çalıştır
            const schedule = generateSchedule({
                courses,
                classrooms,
                students: studentsDB, // StudentWithCourses tipinde
                constraints
            });

            return { success: true, data: schedule };
        } catch (error) {
            console.error("Scheduling Error:", error);
            return { success: false, error: (error as Error).message };
        }
    });
};