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

/**
 * Detailed reason why a course could not be scheduled
 */
interface FailureReason {
    courseCode: string;
    courseEnrollment: number;
    constraintViolations: {
        type: 'capacity' | 'room_conflict' | 'student_conflict' | 'consecutive_exam' | 'max_daily_exams' | 'min_hours_gap';
        description: string;
        affectedStudents?: string[];
        conflictingCourse?: string;
    }[];
    testedSlots: number;
    testedRooms: number;
}

interface ScheduleResult {
    success: boolean;
    schedule: ExamSession[];
    message: string;
    failureDetails?: FailureReason;
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
    maxExamsPerDay: number;
    allowConsecutiveExams: boolean;
    minHoursBetweenExams: number;
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

        // Constraint 4: No Consecutive Exams (configurable)
        // If disabled, students cannot have exams in consecutive time slots
        if (!context.allowConsecutiveExams) {
            const consecutiveConflict = context.assignments.some((a) => {
                const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                if (!studentsInAssignedCourse.includes(studentId)) {
                    return false;
                }
                if (a.timeSlot.dayIndex === timeSlot.dayIndex) {
                    const slotDiff = Math.abs(a.timeSlot.slotIndex - timeSlot.slotIndex);
                    return slotDiff === 1;
                }
                return false;
            });
            if (consecutiveConflict) {
                return false;
            }
        }

        // Constraint 5: Maximum Daily Exams (configurable)
        // A student cannot have more than maxExamsPerDay exams on the same day
        const examsOnSameDay = context.assignments.filter((a) => {
            const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
            return studentsInAssignedCourse.includes(studentId) &&
                a.timeSlot.dayIndex === timeSlot.dayIndex;
        }).length;

        if (examsOnSameDay >= context.maxExamsPerDay) {
            return false;
        }

        // Constraint 6: Minimum Hours Between Exams (configurable)
        // Ensure there's at least minHoursBetweenExams gap between exams for same student
        if (context.minHoursBetweenExams > 0) {
            const minGapMs = context.minHoursBetweenExams * 60 * 60 * 1000; // Convert hours to ms
            const tooCloseExam = context.assignments.some((a) => {
                const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                if (!studentsInAssignedCourse.includes(studentId)) {
                    return false;
                }
                // Check if exams are too close in time
                const examEnd = a.timeSlot.endTime.getTime();
                const newExamStart = timeSlot.startTime.getTime();
                const existingExamStart = a.timeSlot.startTime.getTime();
                const newExamEnd = timeSlot.endTime.getTime();

                // Check gap in both directions
                const gapAfterExisting = newExamStart - examEnd;
                const gapAfterNew = existingExamStart - newExamEnd;

                return (gapAfterExisting >= 0 && gapAfterExisting < minGapMs) ||
                    (gapAfterNew >= 0 && gapAfterNew < minGapMs);
            });
            if (tooCloseExam) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Analyzes why a course cannot be scheduled in any slot.
 * Returns detailed information about constraint violations.
 */
function getFailureReason(
    course: Course,
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext
): FailureReason {
    const violations: FailureReason['constraintViolations'] = [];
    let testedSlots = 0;
    let testedRooms = 0;

    // Track different failure types
    const capacityFails: string[] = [];
    const roomConflicts: { room: string; slot: string; conflictCourse: string }[] = [];
    const studentConflicts: { student: string; slot: string; conflictCourse: string }[] = [];
    const consecutiveFails: { student: string; conflictCourse: string }[] = [];
    const maxDailyFails: { student: string; day: number; existingExams: number }[] = [];
    const minHoursFails: { student: string; conflictCourse: string; gapHours: number }[] = [];

    const studentsInCourse = context.courseStudentMap.get(course.id) || [];

    for (const timeSlot of timeSlots) {
        testedSlots++;

        for (const classroom of classrooms) {
            testedRooms++;

            // Check capacity
            if (classroom.capacity < course.enrolledStudents) {
                if (!capacityFails.includes(classroom.name)) {
                    capacityFails.push(classroom.name);
                }
                continue;
            }

            // Check room conflict
            const roomConflict = context.assignments.find(
                (a) => a.classroom.id === classroom.id && a.timeSlot.id === timeSlot.id
            );
            if (roomConflict) {
                roomConflicts.push({
                    room: classroom.name,
                    slot: timeSlot.startTime.toISOString(),
                    conflictCourse: roomConflict.course.code
                });
                continue;
            }

            // Check student conflicts
            let hasStudentConflict = false;
            for (const studentId of studentsInCourse) {
                const sameTimeConflict = context.assignments.find((a) => {
                    const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                    return studentsInAssignedCourse.includes(studentId) && a.timeSlot.id === timeSlot.id;
                });
                if (sameTimeConflict) {
                    studentConflicts.push({
                        student: studentId,
                        slot: timeSlot.startTime.toISOString(),
                        conflictCourse: sameTimeConflict.course.code
                    });
                    hasStudentConflict = true;
                    break;
                }

                // Check consecutive exams
                if (!context.allowConsecutiveExams) {
                    const consecutiveConflict = context.assignments.find((a) => {
                        const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                        if (!studentsInAssignedCourse.includes(studentId)) return false;
                        if (a.timeSlot.dayIndex === timeSlot.dayIndex) {
                            return Math.abs(a.timeSlot.slotIndex - timeSlot.slotIndex) === 1;
                        }
                        return false;
                    });
                    if (consecutiveConflict) {
                        consecutiveFails.push({
                            student: studentId,
                            conflictCourse: consecutiveConflict.course.code
                        });
                        hasStudentConflict = true;
                        break;
                    }
                }

                // Check max daily exams
                const examsOnSameDay = context.assignments.filter((a) => {
                    const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                    return studentsInAssignedCourse.includes(studentId) && a.timeSlot.dayIndex === timeSlot.dayIndex;
                }).length;
                if (examsOnSameDay >= context.maxExamsPerDay) {
                    maxDailyFails.push({
                        student: studentId,
                        day: timeSlot.dayIndex,
                        existingExams: examsOnSameDay
                    });
                    hasStudentConflict = true;
                    break;
                }

                // Check min hours gap
                if (context.minHoursBetweenExams > 0) {
                    const minGapMs = context.minHoursBetweenExams * 60 * 60 * 1000;
                    const tooCloseExam = context.assignments.find((a) => {
                        const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                        if (!studentsInAssignedCourse.includes(studentId)) return false;
                        const examEnd = a.timeSlot.endTime.getTime();
                        const newExamStart = timeSlot.startTime.getTime();
                        const existingExamStart = a.timeSlot.startTime.getTime();
                        const newExamEnd = timeSlot.endTime.getTime();
                        const gapAfterExisting = newExamStart - examEnd;
                        const gapAfterNew = existingExamStart - newExamEnd;
                        return (gapAfterExisting >= 0 && gapAfterExisting < minGapMs) ||
                            (gapAfterNew >= 0 && gapAfterNew < minGapMs);
                    });
                    if (tooCloseExam) {
                        const gapMs = Math.abs(timeSlot.startTime.getTime() - tooCloseExam.timeSlot.endTime.getTime());
                        minHoursFails.push({
                            student: studentId,
                            conflictCourse: tooCloseExam.course.code,
                            gapHours: gapMs / (60 * 60 * 1000)
                        });
                        hasStudentConflict = true;
                        break;
                    }
                }
            }
        }
    }

    // Build violation descriptions
    if (capacityFails.length === classrooms.length) {
        violations.push({
            type: 'capacity',
            description: `No classroom has enough capacity for ${course.enrolledStudents} students. ` +
                `Largest room: ${Math.max(...classrooms.map(c => c.capacity))} seats.`
        });
    }

    if (studentConflicts.length > 0) {
        const uniqueConflicts = new Map<string, string[]>();
        studentConflicts.forEach(c => {
            if (!uniqueConflicts.has(c.conflictCourse)) {
                uniqueConflicts.set(c.conflictCourse, []);
            }
            uniqueConflicts.get(c.conflictCourse)!.push(c.student);
        });

        uniqueConflicts.forEach((students, conflictCourse) => {
            violations.push({
                type: 'student_conflict',
                description: `${students.length} student(s) are also in ${conflictCourse} which blocks all remaining slots.`,
                affectedStudents: students.slice(0, 5),
                conflictingCourse: conflictCourse
            });
        });
    }

    if (maxDailyFails.length > 0) {
        const uniqueDays = new Set(maxDailyFails.map(f => f.day));
        violations.push({
            type: 'max_daily_exams',
            description: `Students already have ${context.maxExamsPerDay} exams on ${uniqueDays.size} day(s), ` +
                `blocking those days (max ${context.maxExamsPerDay}/day allowed).`,
            affectedStudents: [...new Set(maxDailyFails.map(f => f.student))].slice(0, 5)
        });
    }

    if (minHoursFails.length > 0) {
        violations.push({
            type: 'min_hours_gap',
            description: `Exams would be too close together (need ${context.minHoursBetweenExams}h gap). ` +
                `Conflicts with: ${[...new Set(minHoursFails.map(f => f.conflictCourse))].join(', ')}.`,
            affectedStudents: [...new Set(minHoursFails.map(f => f.student))].slice(0, 5)
        });
    }

    if (consecutiveFails.length > 0) {
        violations.push({
            type: 'consecutive_exam',
            description: `Would create consecutive exams for students (not allowed). ` +
                `Conflicts with: ${[...new Set(consecutiveFails.map(f => f.conflictCourse))].join(', ')}.`,
            affectedStudents: [...new Set(consecutiveFails.map(f => f.student))].slice(0, 5)
        });
    }

    return {
        courseCode: course.code,
        courseEnrollment: course.enrolledStudents,
        constraintViolations: violations,
        testedSlots,
        testedRooms
    };
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
 * @param iterationCount - Reference object to track iterations
 * @param maxIterations - Maximum allowed iterations before timeout
 * @returns true if a valid schedule was found, false otherwise
 */
function solve(
    courses: Course[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext,
    index: number,
    startTime: number,
    timeoutMs: number
): boolean {
    // Check for timeout (time-based, not iteration-based)
    if (Date.now() - startTime > timeoutMs) {
        return false; // Stop trying - timeout reached
    }

    // Base case: All courses have been scheduled
    if (index === courses.length) {
        return true;
    }

    const currentCourse = courses[index];

    // Try each time slot
    for (const timeSlot of timeSlots) {
        // Check for timeout in inner loop
        if (Date.now() - startTime > timeoutMs) {
            return false;
        }

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
                if (solve(courses, classrooms, timeSlots, context, index + 1, startTime, timeoutMs)) {
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

/**
 * Greedy scheduling algorithm - faster for large datasets.
 * Assigns each course to the first valid time slot/room combination.
 * O(courses * timeSlots * classrooms) - much faster than backtracking.
 * Returns both success status and detailed failure reason if failed.
 */
function solveGreedy(
    courses: Course[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext
): { success: boolean; failureReason?: FailureReason } {
    console.log(`Greedy solver: ${courses.length} courses, ${timeSlots.length} slots, ${classrooms.length} rooms`);

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        let assigned = false;

        // Try each time slot
        for (const timeSlot of timeSlots) {
            if (assigned) break;

            // Try each classroom
            for (const classroom of classrooms) {
                if (isSafe(course, classroom, timeSlot, context)) {
                    // Make the assignment
                    context.assignments.push({
                        course,
                        classroom,
                        timeSlot
                    });
                    assigned = true;
                    break;
                }
            }
        }

        if (!assigned) {
            // Could not find a valid slot for this course - analyze why
            const failureReason = getFailureReason(course, classrooms, timeSlots, context);
            console.log(`FAILED at course ${i + 1}/${courses.length}: ${course.code} (${course.enrolledStudents} students)`);
            console.log(`  Scheduled so far: ${context.assignments.length} courses`);
            console.log(`  Violations:`, failureReason.constraintViolations.map(v => v.description));
            return { success: false, failureReason };
        }

        // Progress log every 20 courses
        if ((i + 1) % 20 === 0) {
            console.log(`  Progress: ${i + 1}/${courses.length} courses scheduled`);
        }
    }

    console.log(`SUCCESS: All ${courses.length} courses scheduled!`);
    return { success: true }; // All courses scheduled
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

    // Initialize validation context with configurable constraints
    const context: ValidationContext = {
        assignments: [],
        courseStudentMap,
        studentCourseMap,
        maxExamsPerDay: constraints.maxExamsPerDay ?? 2,
        allowConsecutiveExams: constraints.allowConsecutiveExams ?? true,
        minHoursBetweenExams: constraints.minHoursBetweenExams ?? 1
    };

    // Choose algorithm based on dataset size
    // Greedy: Fast, good for large datasets (50+ courses)
    // Backtracking: Slower but can find solutions where greedy fails (small datasets)
    const useGreedy = courses.length >= 50;
    let success: boolean;
    let timedOut = false;
    let failureDetails: FailureReason | undefined;

    if (useGreedy) {
        console.log(`Using GREEDY algorithm for ${courses.length} courses (fast mode)`);
        const greedyResult = solveGreedy(sortedCourses, classrooms, timeSlots, context);
        success = greedyResult.success;
        failureDetails = greedyResult.failureReason;
    } else {
        // Use backtracking with timeout for smaller datasets
        const baseTimeout = 5000;
        const scaleFactor = Math.max(1, Math.ceil(courses.length / 20));
        const timeoutMs = Math.min(baseTimeout * scaleFactor, 30000);
        console.log(`Using BACKTRACKING algorithm for ${courses.length} courses (timeout: ${timeoutMs}ms)`);
        success = solve(sortedCourses, classrooms, timeSlots, context, 0, startTime, timeoutMs);
        timedOut = (Date.now() - startTime) >= timeoutMs;

        // If backtracking failed, get failure reason for the first unscheduled course
        if (!success && sortedCourses.length > context.assignments.length) {
            const failedCourse = sortedCourses[context.assignments.length];
            failureDetails = getFailureReason(failedCourse, classrooms, timeSlots, context);
        }
    }

    const endTime = Date.now();

    if (!success) {
        // Build detailed error message
        let detailedMessage = timedOut
            ? 'The algorithm timed out while searching for a valid schedule. '
            : 'Unable to generate a valid schedule. ';

        if (failureDetails) {
            detailedMessage += `\n\nFailed at course: ${failureDetails.courseCode} (${failureDetails.courseEnrollment} students)\n`;
            if (failureDetails.constraintViolations.length > 0) {
                detailedMessage += '\nConstraint violations:\n';
                failureDetails.constraintViolations.forEach((v, i) => {
                    detailedMessage += `${i + 1}. ${v.description}\n`;
                });
            }
            detailedMessage += `\nTested ${failureDetails.testedSlots} time slots × ${failureDetails.testedRooms} room combinations.`;
        }

        detailedMessage += '\n\nSuggestions: Try adding more classrooms, extending the exam period, ' +
            'increasing max exams per day, or reducing the minimum hours between exams.';

        return {
            success: false,
            schedule: [],
            message: detailedMessage,
            failureDetails,
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
