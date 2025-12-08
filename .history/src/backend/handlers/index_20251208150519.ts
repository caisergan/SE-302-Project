import { registerCourseHandlers } from './courseHandler';
import { registerClassroomHandlers } from './classroomHandler';
import { registerStudentHandlers } from './studentHandler';
import { registerScheduleHandlers } from './scheduleHandler'; // YENİ

export const registerHandlers = () => {
    registerCourseHandlers();
    registerClassroomHandlers();
    registerStudentHandlers();
    registerScheduleHandlers(); // YENİ
};