/**
 * Exam Scheduling Engine
 * 
 * Implements a Constraint Satisfaction Problem (CSP) solver using
 * Recursive Backtracking with the Degree Heuristic for exam scheduling.
 */

import type { Course, Classroom, Student, ExamSession, GenerationConstraints } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface TimeSlot {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    dayIndex: number;  // 0-based day number in the exam period
    slotIndex: number; // 0-based slot number within the day
}

interface ScheduleAssignment {
    course: Course;
    classroom: Classroom;
    timeSlot: TimeSlot;
}

interface ScheduleResult {
    success: boolean;
    schedule: ExamSession[];
    message: string;
    stats?: {
        totalCourses: number;
        scheduledCourses: number;
        totalTimeSlots: number;
        totalClassrooms: number;
        generationTimeMs: number;
    };
}

// ============================================================================
// Configuration Constants
// ============================================================================

const EXAM_DURATION_HOURS = 2;
const BREAK_BETWEEN_EXAMS_HOURS = 1;
const MAX_EXAMS_PER_DAY_PER_STUDENT = 2;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a Date as a local ISO string (preserves local timezone).
 * This prevents the UTC conversion that happens with toISOString().
 */
function toLocalISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Generates all available time slots based on the given constraints.
 */
function generateTimeSlots(constraints: GenerationConstraints): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const startDate = new Date(constraints.startDate);
    const endDate = new Date(constraints.endDate);

    // Parse daily time boundaries
    const [startHour, startMinute] = constraints.dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = constraints.dailyEndTime.split(':').map(Number);

    let dayIndex = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        // Skip weekends if not included
        if (!constraints.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        // Generate slots for this day
        let slotIndex = 0;
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour + EXAM_DURATION_HOURS <= endHour ||
            (currentHour + EXAM_DURATION_HOURS === endHour && currentMinute <= endMinute)) {

            const slotStart = new Date(currentDate);
            slotStart.setHours(currentHour, currentMinute, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setHours(slotStart.getHours() + EXAM_DURATION_HOURS);

            slots.push({
                id: `day${dayIndex}_slot${slotIndex}`,
                date: new Date(currentDate),
                startTime: slotStart,
                endTime: slotEnd,
                dayIndex,
                slotIndex
            });

            // Move to next slot (exam duration + break)
            currentHour += EXAM_DURATION_HOURS + BREAK_BETWEEN_EXAMS_HOURS;
            slotIndex++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
        dayIndex++;
    }

    return slots;
}

/**
 * Sorts courses by difficulty using the Degree Heuristic.
 * Courses with more enrolled students are scheduled first (harder to place).
 */
function sortCoursesByDifficulty(courses: Course[]): Course[] {
    return [...courses].sort((a, b) => b.enrolledStudents - a.enrolledStudents);
}

/**
 * Builds a lookup map: studentId -> list of courseIds they're enrolled in
 */
function buildStudentCourseMap(students: Student[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const student of students) {
        map.set(student.id, [...student.enrolledCourses]);
    }
    return map;
}

/**
 * Builds a lookup map: courseId -> list of studentIds enrolled in it
 */
function buildCourseStudentMap(students: Student[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const student of students) {
        for (const courseId of student.enrolledCourses) {
            if (!map.has(courseId)) {
                map.set(courseId, []);
            }
            map.get(courseId)!.push(student.id);
        }
    }
    return map;
}

// ============================================================================
// Constraint Validation
// ============================================================================

interface ValidationContext {
    assignments: ScheduleAssignment[];
    courseStudentMap: Map<string, string[]>;
    studentCourseMap: Map<string, string[]>;
}

/**
 * Checks if a course can be assigned to a specific classroom and time slot.
 * Returns true if all constraints are satisfied.
 */
function isSafe(
    course: Course,
    classroom: Classroom,
    timeSlot: TimeSlot,
    context: ValidationContext
): boolean {
    // Constraint 1: Capacity Check
    // Room must have enough capacity for all enrolled students
    if (classroom.capacity < course.enrolledStudents) {
        return false;
    }

    // Constraint 2: Room Availability Check
    // The classroom must not be already booked at this time
    const roomConflict = context.assignments.some(
        (a) => a.classroom.id === classroom.id && a.timeSlot.id === timeSlot.id
    );
    if (roomConflict) {
        return false;
    }

    // Get students enrolled in this course
    const studentsInCourse = context.courseStudentMap.get(course.id) || [];

    for (const studentId of studentsInCourse) {
        // Constraint 3: No Student Conflicts
        // A student cannot have two exams at the same time slot
        const sameTimeConflict = context.assignments.some((a) => {
            const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
            return studentsInAssignedCourse.includes(studentId) && a.timeSlot.id === timeSlot.id;
        });
        if (sameTimeConflict) {
            return false;
        }

        // Constraint 4: No Consecutive Exams
        // A student should not have exams in consecutive time slots on the same day
        const consecutiveConflict = context.assignments.some((a) => {
            const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
            if (!studentsInAssignedCourse.includes(studentId)) {
                return false;
            }
            // Check if on the same day and consecutive slot
            if (a.timeSlot.dayIndex === timeSlot.dayIndex) {
                const slotDiff = Math.abs(a.timeSlot.slotIndex - timeSlot.slotIndex);
                return slotDiff === 1;
            }
            return false;
        });
        if (consecutiveConflict) {
            return false;
        }

        // Constraint 5: Maximum Daily Exams
        // A student cannot have more than MAX_EXAMS_PER_DAY_PER_STUDENT exams on the same day
        const examsOnSameDay = context.assignments.filter((a) => {
            const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
            return studentsInAssignedCourse.includes(studentId) &&
                a.timeSlot.dayIndex === timeSlot.dayIndex;
        }).length;

        if (examsOnSameDay >= MAX_EXAMS_PER_DAY_PER_STUDENT) {
            return false;
        }
    }

    return true;
}

// ============================================================================
// Backtracking Solver
// ============================================================================

/**
 * Recursively attempts to schedule all courses using backtracking.
 * 
 * @param courses - List of courses to schedule (sorted by difficulty)
 * @param classrooms - Available classrooms
 * @param timeSlots - Available time slots
 * @param context - Validation context with current assignments
 * @param index - Current index in the courses array
 * @returns true if a valid schedule was found, false otherwise
 */
function solve(
    courses: Course[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext,
    index: number
): boolean {
    // Base case: All courses have been scheduled
    if (index === courses.length) {
        return true;
    }

    const currentCourse = courses[index];

    // Try each time slot
    for (const timeSlot of timeSlots) {
        // Try each classroom
        for (const classroom of classrooms) {
            // Check if this assignment satisfies all constraints
            if (isSafe(currentCourse, classroom, timeSlot, context)) {
                // Make the assignment
                const assignment: ScheduleAssignment = {
                    course: currentCourse,
                    classroom,
                    timeSlot
                };
                context.assignments.push(assignment);

                // Recursively try to schedule the remaining courses
                if (solve(courses, classrooms, timeSlots, context, index + 1)) {
                    return true;
                }

                // Backtrack: Remove the assignment and try another option
                context.assignments.pop();
            }
        }
    }

    // No valid assignment found for this course
    return false;
}

// ============================================================================
// Main Scheduling Function
// ============================================================================

/**
 * Generates an exam schedule based on the provided data and constraints.
 * 
 * @param courses - List of courses requiring exams
 * @param classrooms - Available classrooms
 * @param students - List of students with their course enrollments
 * @param constraints - Scheduling constraints (dates, times, etc.)
 * @returns ScheduleResult with success status and generated schedule
 */
export function generateSchedule(
    courses: Course[],
    classrooms: Classroom[],
    students: Student[],
    constraints: GenerationConstraints
): ScheduleResult {
    const startTime = Date.now();

    // Validate input
    if (courses.length === 0) {
        return {
            success: false,
            schedule: [],
            message: 'No courses provided for scheduling.'
        };
    }

    if (classrooms.length === 0) {
        return {
            success: false,
            schedule: [],
            message: 'No classrooms available for scheduling.'
        };
    }

    // Generate time slots
    const timeSlots = generateTimeSlots(constraints);

    if (timeSlots.length === 0) {
        return {
            success: false,
            schedule: [],
            message: 'No valid time slots available. Check your date range and daily time settings.'
        };
    }

    // Sort courses by difficulty (Degree Heuristic)
    const sortedCourses = sortCoursesByDifficulty(courses);

    // Build lookup maps for efficient constraint checking
    const courseStudentMap = buildCourseStudentMap(students);
    const studentCourseMap = buildStudentCourseMap(students);

    // Initialize validation context
    const context: ValidationContext = {
        assignments: [],
        courseStudentMap,
        studentCourseMap
    };

    // Run the backtracking solver
    const success = solve(sortedCourses, classrooms, timeSlots, context, 0);

    const endTime = Date.now();

    if (!success) {
        return {
            success: false,
            schedule: [],
            message: 'Unable to generate a valid schedule. The constraints are too restrictive. ' +
                'Try adding more classrooms, extending the exam period, or reducing course enrollments.',
            stats: {
                totalCourses: courses.length,
                scheduledCourses: context.assignments.length,
                totalTimeSlots: timeSlots.length,
                totalClassrooms: classrooms.length,
                generationTimeMs: endTime - startTime
            }
        };
    }

    // Convert assignments to ExamSessions
    const schedule: ExamSession[] = context.assignments.map((a, idx) => ({
        id: `exam_${idx + 1}`,
        courseId: a.course.id,
        classroomId: a.classroom.id,
        startTime: a.timeSlot.startTime,
        endTime: a.timeSlot.endTime
    }));

    return {
        success: true,
        schedule,
        message: `Successfully scheduled ${schedule.length} exams.`,
        stats: {
            totalCourses: courses.length,
            scheduledCourses: schedule.length,
            totalTimeSlots: timeSlots.length,
            totalClassrooms: classrooms.length,
            generationTimeMs: endTime - startTime
        }
    };
}

// ============================================================================
// Schedule Validation (for imported/modified schedules)
// ============================================================================

/**
 * Validates an existing schedule against all constraints.
 * Useful for checking imported schedules or manual modifications.
 */
export function validateSchedule(
    schedule: ExamSession[],
    courses: Course[],
    classrooms: Classroom[],
    students: Student[]
): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Build lookup maps
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const classroomMap = new Map(classrooms.map(c => [c.id, c]));
    const courseStudentMap = buildCourseStudentMap(students);

    for (const session of schedule) {
        const course = courseMap.get(session.courseId);
        const classroom = classroomMap.get(session.classroomId);

        if (!course) {
            violations.push(`Session ${session.id}: Course ${session.courseId} not found.`);
            continue;
        }

        if (!classroom) {
            violations.push(`Session ${session.id}: Classroom ${session.classroomId} not found.`);
            continue;
        }

        // Check capacity
        if (classroom.capacity < course.enrolledStudents) {
            violations.push(
                `Session ${session.id}: Classroom ${classroom.name} (capacity ${classroom.capacity}) ` +
                `cannot fit ${course.enrolledStudents} students from ${course.code}.`
            );
        }
    }

    // Check for time conflicts
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
            const s1 = schedule[i];
            const s2 = schedule[j];

            // Check same room at same time
            if (s1.classroomId === s2.classroomId) {
                if (s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
                    violations.push(
                        `Room conflict: ${s1.courseId} and ${s2.courseId} overlap in classroom ${s1.classroomId}.`
                    );
                }
            }

            // Check student conflicts
            const students1 = courseStudentMap.get(s1.courseId) || [];
            const students2 = courseStudentMap.get(s2.courseId) || [];
            const commonStudents = students1.filter(s => students2.includes(s));

            if (commonStudents.length > 0 &&
                s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
                violations.push(
                    `Student conflict: ${commonStudents.length} student(s) have overlapping exams ` +
                    `for ${s1.courseId} and ${s2.courseId}.`
                );
            }
        }
    }

    return {
        valid: violations.length === 0,
        violations
    };
}
