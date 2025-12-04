import { registerCourseHandlers } from './courseHandler';
import { registerClassroomHandlers } from './classroomHandler';
import { registerStudentHandlers } from './studentHandler';

export const registerHandlers = () => {
    registerCourseHandlers();
    registerClassroomHandlers();
    registerStudentHandlers();
};
