import { registerCourseHandlers } from './courseHandler';
import { registerClassroomHandlers } from './classroomHandler';
import { registerStudentHandlers } from './studentHandler';
import { registerSchedulerHandlers } from './schedulerHandler';
import { registerScheduleHandlers } from './scheduleHandler';
import { registerSettingsHandlers } from './settingsHandler';

export const registerHandlers = () => {
    registerCourseHandlers();
    registerClassroomHandlers();
    registerStudentHandlers();
    registerSchedulerHandlers();
    registerScheduleHandlers();
    registerSettingsHandlers();
};
