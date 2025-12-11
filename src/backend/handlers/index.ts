import { registerCourseHandlers } from './courseHandler';
import { registerClassroomHandlers } from './classroomHandler';
import { registerStudentHandlers } from './studentHandler';
import { registerSchedulerHandlers } from './schedulerHandler';
import { registerScheduleHandlers } from './scheduleHandler';

export const registerHandlers = () => {
    registerCourseHandlers();
    registerClassroomHandlers();
    registerStudentHandlers();
    registerSchedulerHandlers();
    registerScheduleHandlers();
};
