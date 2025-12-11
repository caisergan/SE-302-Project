import { ipcMain } from 'electron';
import { generateSchedule, validateSchedule } from '../services/schedulerService';
import * as courseService from '../services/courseService';
import * as classroomService from '../services/classroomService';
import * as studentService from '../services/studentService';
import type { Course, Classroom, Student, GenerationConstraints, ExamSession } from '../../types';

/**
 * Maps database course type to algorithm course type
 */
function mapCourses(coursesDB: courseService.CourseDB[]): Course[] {
    return coursesDB.map(c => ({
        id: c.code, // Use course code as ID for algorithm (matches student enrollment)
        code: c.code,
        name: c.name,
        enrolledStudents: c.enrolled_students
    }));
}

/**
 * Maps database classroom type to algorithm classroom type
 */
function mapClassrooms(classroomsDB: classroomService.ClassroomDB[]): Classroom[] {
    return classroomsDB.map(c => ({
        id: c.id.toString(),
        name: c.name,
        capacity: c.capacity,
        building: c.building
    }));
}

/**
 * Maps database student type to algorithm student type
 */
function mapStudents(studentsDB: studentService.StudentWithCourses[]): Student[] {
    return studentsDB.map(s => ({
        id: s.student_number,
        name: s.name,
        email: `${s.student_number}@uni.edu`,
        enrolledCourses: s.enrolled_courses
    }));
}

export const registerSchedulerHandlers = () => {
    /**
     * Generate a new exam schedule based on constraints
     */
    ipcMain.handle('generate-schedule', async (_, constraints: GenerationConstraints) => {
        try {
            // Fetch all required data from database
            const coursesDB = courseService.getCourses();
            const classroomsDB = classroomService.getClassrooms();
            const studentsDB = studentService.getStudents();

            // Map to algorithm types
            const courses = mapCourses(coursesDB);
            const classrooms = mapClassrooms(classroomsDB);
            const students = mapStudents(studentsDB);

            // Run the scheduling algorithm
            const result = generateSchedule(courses, classrooms, students, constraints);

            return result;
        } catch (error) {
            return {
                success: false,
                schedule: [],
                message: `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    });

    /**
     * Validate an existing schedule
     */
    ipcMain.handle('validate-schedule', async (_, schedule: ExamSession[]) => {
        try {
            const coursesDB = courseService.getCourses();
            const classroomsDB = classroomService.getClassrooms();
            const studentsDB = studentService.getStudents();

            const courses = mapCourses(coursesDB);
            const classrooms = mapClassrooms(classroomsDB);
            const students = mapStudents(studentsDB);

            return validateSchedule(schedule, courses, classrooms, students);
        } catch (error) {
            return {
                valid: false,
                violations: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    });
};
