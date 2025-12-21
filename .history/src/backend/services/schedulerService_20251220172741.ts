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
    studentCount: number;
}

/**
 * Detailed reason why a course could not be scheduled
 */
interface ConstraintViolation {
    type: 'capacity' | 'room_conflict' | 'student_conflict' | 'consecutive_exam' | 'max_daily_exams' | 'min_hours_gap';
    severity: 'blocking' | 'contributing';
    description: string;
    details: {
        affectedStudentCount?: number;
        sampleStudents?: string[];
        conflictingCourses?: string[];
        blockedSlots?: number;
        requiredCapacity?: number;
        maxAvailableCapacity?: number;
    };
}

interface FailureReason {
    courseCode: string;
    courseEnrollment: number;
    courseIndex: number;
    totalCourses: number;
    rootCause: string;
    rootCauseType: ConstraintViolation['type'];
    constraintViolations: ConstraintViolation[];
    suggestions: {
        priority: 'high' | 'medium' | 'low';
        action: string;
        impact: string;
    }[];
    diagnostics: {
        testedSlots: number;
        testedRooms: number;
        scheduledSoFar: number;
        availableSlots: number;
        availableRooms: number;
        slotsBlockedByStudentConflicts: number;
        slotsBlockedByRoomConflicts: number;
        roomsBlockedByCapacity: number;
    };
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
 * The break between slots is determined by minHoursBetweenExams (defaults to 1 hour).
 */
function generateTimeSlots(constraints: GenerationConstraints): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const startDate = new Date(constraints.startDate);
    const endDate = new Date(constraints.endDate);

    // Parse daily time boundaries
    const [startHour, startMinute] = constraints.dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = constraints.dailyEndTime.split(':').map(Number);

    // Use the user's minHoursBetweenExams as the break between slots (minimum 1 hour for logistics)
    const breakBetweenSlots = Math.max(1, constraints.minHoursBetweenExams ?? 1);

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

            // Move to next slot (exam duration + user-defined break)
            currentHour += EXAM_DURATION_HOURS + breakBetweenSlots;
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
            if (a.course.id === course.id) return false;
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
 * Returns detailed information about constraint violations with root cause analysis.
 */
function getFailureReason(
    course: Course,
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext,
    courseIndex: number = 0,
    totalCourses: number = 0
): FailureReason {
    const violations: ConstraintViolation[] = [];

    // Diagnostic counters
    let slotsBlockedByStudentConflicts = 0;
    let slotsBlockedByRoomConflicts = 0;
    let roomsBlockedByCapacity = 0;

    // Track different failure types with details
    const capacityIssue = { rooms: [] as string[], maxCapacity: 0 };
    const studentConflictMap = new Map<string, { students: Set<string>; slots: number }>();
    const maxDailyIssue = { affectedStudents: new Set<string>(), blockedDays: new Set<number>() };
    const minHoursIssue = { affectedStudents: new Set<string>(), courses: new Set<string>() };
    const consecutiveIssue = { affectedStudents: new Set<string>(), courses: new Set<string>() };

    const studentsInCourse = context.courseStudentMap.get(course.id) || [];
    const roomsWithCapacity = classrooms.filter(c => c.capacity >= course.enrolledStudents);

    // Calculate capacity stats
    const maxRoomCapacity = Math.max(...classrooms.map(c => c.capacity), 0);
    roomsBlockedByCapacity = classrooms.length - roomsWithCapacity.length;

    // Analyze each slot
    for (const timeSlot of timeSlots) {
        for (const classroom of roomsWithCapacity) {
            // Check room already booked
            const roomConflict = context.assignments.find(
                (a) => a.classroom.id === classroom.id && a.timeSlot.id === timeSlot.id
            );
            if (roomConflict) {
                slotsBlockedByRoomConflicts++;
                continue;
            }

            // Check student conflicts (most important)
            let slotBlocked = false;
            for (const studentId of studentsInCourse) {
                // Same time conflict
                const sameTimeConflict = context.assignments.find((a) => {
                    const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                    return studentsInAssignedCourse.includes(studentId) && a.timeSlot.id === timeSlot.id;
                });
                if (sameTimeConflict) {
                    if (!studentConflictMap.has(sameTimeConflict.course.code)) {
                        studentConflictMap.set(sameTimeConflict.course.code, { students: new Set(), slots: 0 });
                    }
                    const entry = studentConflictMap.get(sameTimeConflict.course.code)!;
                    entry.students.add(studentId);
                    entry.slots++;
                    slotsBlockedByStudentConflicts++;
                    slotBlocked = true;
                    break;
                }

                // Max daily exams
                const examsOnSameDay = context.assignments.filter((a) => {
                    const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                    return studentsInAssignedCourse.includes(studentId) && a.timeSlot.dayIndex === timeSlot.dayIndex;
                }).length;
                if (examsOnSameDay >= context.maxExamsPerDay) {
                    maxDailyIssue.affectedStudents.add(studentId);
                    maxDailyIssue.blockedDays.add(timeSlot.dayIndex);
                    slotBlocked = true;
                    break;
                }

                // Consecutive exams
                if (!context.allowConsecutiveExams) {
                    const consecutiveConflict = context.assignments.find((a) => {
                        const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                        if (!studentsInAssignedCourse.includes(studentId)) return false;
                        return a.timeSlot.dayIndex === timeSlot.dayIndex &&
                            Math.abs(a.timeSlot.slotIndex - timeSlot.slotIndex) === 1;
                    });
                    if (consecutiveConflict) {
                        consecutiveIssue.affectedStudents.add(studentId);
                        consecutiveIssue.courses.add(consecutiveConflict.course.code);
                        slotBlocked = true;
                        break;
                    }
                }

                // Min hours gap
                if (context.minHoursBetweenExams > 0) {
                    const minGapMs = context.minHoursBetweenExams * 60 * 60 * 1000;
                    const tooCloseExam = context.assignments.find((a) => {
                        const studentsInAssignedCourse = context.courseStudentMap.get(a.course.id) || [];
                        if (!studentsInAssignedCourse.includes(studentId)) return false;
                        const gapAfterExisting = timeSlot.startTime.getTime() - a.timeSlot.endTime.getTime();
                        const gapAfterNew = a.timeSlot.startTime.getTime() - timeSlot.endTime.getTime();
                        return (gapAfterExisting >= 0 && gapAfterExisting < minGapMs) ||
                            (gapAfterNew >= 0 && gapAfterNew < minGapMs);
                    });
                    if (tooCloseExam) {
                        minHoursIssue.affectedStudents.add(studentId);
                        minHoursIssue.courses.add(tooCloseExam.course.code);
                        slotBlocked = true;
                        break;
                    }
                }
            }
        }
    }

    // Determine root cause and build violations
    let rootCause = '';
    let rootCauseType: ConstraintViolation['type'] = 'capacity';

    // Priority 1: Capacity issue (no room can fit)
    if (roomsWithCapacity.length === 0) {
        rootCause = `NO ROOM AVAILABLE: Course has ${course.enrolledStudents} students but largest room only has ${maxRoomCapacity} seats.`;
        rootCauseType = 'capacity';
        violations.push({
            type: 'capacity',
            severity: 'blocking',
            description: `Need ${course.enrolledStudents - maxRoomCapacity} more seats. No room is large enough.`,
            details: {
                requiredCapacity: course.enrolledStudents,
                maxAvailableCapacity: maxRoomCapacity
            }
        });
    }
    // Priority 2: Student conflicts blocking all slots
    else if (studentConflictMap.size > 0) {
        const topConflict = [...studentConflictMap.entries()].sort((a, b) => b[1].students.size - a[1].students.size)[0];
        const [conflictCourse, data] = topConflict;
        rootCause = `STUDENT CONFLICT: ${data.students.size} students share both ${course.code} and ${conflictCourse}. All available slots are blocked.`;
        rootCauseType = 'student_conflict';

        studentConflictMap.forEach((data, conflictCourse) => {
            violations.push({
                type: 'student_conflict',
                severity: data.slots > timeSlots.length / 2 ? 'blocking' : 'contributing',
                description: `${data.students.size} students also enrolled in ${conflictCourse}`,
                details: {
                    affectedStudentCount: data.students.size,
                    sampleStudents: [...data.students].slice(0, 3),
                    conflictingCourses: [conflictCourse],
                    blockedSlots: data.slots
                }
            });
        });
    }
    // Priority 3: Max daily exams
    else if (maxDailyIssue.affectedStudents.size > 0) {
        rootCause = `MAX DAILY LIMIT: ${maxDailyIssue.affectedStudents.size} students already have ${context.maxExamsPerDay} exams on ${maxDailyIssue.blockedDays.size} day(s).`;
        rootCauseType = 'max_daily_exams';
        violations.push({
            type: 'max_daily_exams',
            severity: 'blocking',
            description: `Daily limit of ${context.maxExamsPerDay} exams reached for students`,
            details: {
                affectedStudentCount: maxDailyIssue.affectedStudents.size,
                sampleStudents: [...maxDailyIssue.affectedStudents].slice(0, 3),
                blockedSlots: maxDailyIssue.blockedDays.size * (timeSlots.length / (new Set(timeSlots.map(t => t.dayIndex)).size || 1))
            }
        });
    }
    // Priority 4: Min hours gap
    else if (minHoursIssue.affectedStudents.size > 0) {
        rootCause = `TIME GAP VIOLATION: ${context.minHoursBetweenExams}h gap required but conflicts with ${[...minHoursIssue.courses].join(', ')}.`;
        rootCauseType = 'min_hours_gap';
        violations.push({
            type: 'min_hours_gap',
            severity: 'blocking',
            description: `Need ${context.minHoursBetweenExams}h gap between exams`,
            details: {
                affectedStudentCount: minHoursIssue.affectedStudents.size,
                sampleStudents: [...minHoursIssue.affectedStudents].slice(0, 3),
                conflictingCourses: [...minHoursIssue.courses]
            }
        });
    }
    // Priority 5: Consecutive exams
    else if (consecutiveIssue.affectedStudents.size > 0) {
        rootCause = `CONSECUTIVE EXAM BAN: Would place back-to-back with ${[...consecutiveIssue.courses].join(', ')}.`;
        rootCauseType = 'consecutive_exam';
        violations.push({
            type: 'consecutive_exam',
            severity: 'blocking',
            description: 'Consecutive exams not allowed for same student',
            details: {
                affectedStudentCount: consecutiveIssue.affectedStudents.size,
                sampleStudents: [...consecutiveIssue.affectedStudents].slice(0, 3),
                conflictingCourses: [...consecutiveIssue.courses]
            }
        });
    }
    // Fallback: General resource constraint
    else {
        rootCause = `RESOURCE EXHAUSTED: All ${timeSlots.length} slots × ${roomsWithCapacity.length} rooms are occupied or blocked.`;
        rootCauseType = 'room_conflict';
        violations.push({
            type: 'room_conflict',
            severity: 'blocking',
            description: 'All available time/room combinations are already used',
            details: { blockedSlots: slotsBlockedByRoomConflicts }
        });
    }

    // Generate precise suggestions based on root cause
    const suggestions: FailureReason['suggestions'] = [];

    if (rootCauseType === 'capacity') {
        suggestions.push({
            priority: 'high',
            action: `Add a room with ${course.enrolledStudents}+ seats`,
            impact: `Will immediately allow scheduling ${course.code}`
        });
    }

    if (rootCauseType === 'student_conflict' && studentConflictMap.size > 0) {
        const topConflict = [...studentConflictMap.entries()].sort((a, b) => b[1].students.size - a[1].students.size)[0];
        suggestions.push({
            priority: 'high',
            action: `Add ${Math.ceil(timeSlots.length * 0.3)} more time slots (extend exam period by 1-2 days)`,
            impact: `Creates room for ${course.code} and ${topConflict[0]} at different times`
        });
        suggestions.push({
            priority: 'medium',
            action: `Add ${Math.ceil(roomsWithCapacity.length * 0.5)} more large classrooms`,
            impact: 'Enables parallel scheduling of conflicting courses'
        });
    }

    if (rootCauseType === 'max_daily_exams') {
        suggestions.push({
            priority: 'high',
            action: `Increase max exams per day from ${context.maxExamsPerDay} to ${context.maxExamsPerDay + 1}`,
            impact: `Frees up ${maxDailyIssue.blockedDays.size} days for ${course.code}`
        });
        suggestions.push({
            priority: 'medium',
            action: 'Extend exam period by 2+ days',
            impact: `Spreads exams over more days for ${maxDailyIssue.affectedStudents.size} students`
        });
    }

    if (rootCauseType === 'min_hours_gap') {
        suggestions.push({
            priority: 'high',
            action: `Reduce minimum hours gap from ${context.minHoursBetweenExams}h to ${Math.max(0, context.minHoursBetweenExams - 1)}h`,
            impact: `Opens ${Math.ceil(timeSlots.length * 0.2)} more slot combinations`
        });
    }

    if (rootCauseType === 'consecutive_exam') {
        suggestions.push({
            priority: 'high',
            action: 'Allow consecutive exams (enable in settings)',
            impact: `Unblocks slots adjacent to ${[...consecutiveIssue.courses].join(', ')}`
        });
    }

    return {
        courseCode: course.code,
        courseEnrollment: course.enrolledStudents,
        courseIndex,
        totalCourses,
        rootCause,
        rootCauseType,
        constraintViolations: violations,
        suggestions,
        diagnostics: {
            testedSlots: timeSlots.length,
            testedRooms: roomsWithCapacity.length * timeSlots.length,
            scheduledSoFar: context.assignments.length,
            availableSlots: timeSlots.length,
            availableRooms: roomsWithCapacity.length,
            slotsBlockedByStudentConflicts,
            slotsBlockedByRoomConflicts,
            roomsBlockedByCapacity
        }
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
/**
 * Recursive Backtracking Solver with SPLIT SUPPORT.
 * Tries to schedule courses by splitting them across multiple rooms if necessary.
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
    // Timeout Check
    if (Date.now() - startTime > timeoutMs) return false;

    // Base Case: All courses scheduled
    if (index === courses.length) return true;

    const currentCourse = courses[index];

    // Try each time slot
    for (const timeSlot of timeSlots) {
        if (Date.now() - startTime > timeoutMs) return false;

        // 1. Check Student Constraints FIRST (Optimization)
        // If students are busy in this slot, don't bother checking rooms
        if (!isSafe(currentCourse, classrooms[0], timeSlot, context)) {
            continue;
        }

        // 2. Find Available Rooms in this Slot
        // Identify rooms NOT used in this slot by previous recursive steps
        const occupiedRoomIds = new Set(
            context.assignments
                .filter(a => a.timeSlot.id === timeSlot.id)
                .map(a => a.classroom.id)
        );

        // Sort available rooms: Largest Capacity First (Best for filling large courses)
        const availableRooms = classrooms
            .filter(r => !occupiedRoomIds.has(r.id))
            .sort((a, b) => b.capacity - a.capacity);

        // 3. Try to Split the Course
        let studentsRemaining = currentCourse.enrolledStudents;
        const potentialAssignments: ScheduleAssignment[] = [];

        // Fill rooms until students are covered
        for (const room of availableRooms) {
            if (studentsRemaining <= 0) break;

            const count = Math.min(studentsRemaining, room.capacity);
            
            potentialAssignments.push({
                course: currentCourse,
                classroom: room,
                timeSlot: timeSlot,
                studentCount: count
            });

            studentsRemaining -= count;
        }

        // 4. If we successfully found room(s) for ALL students in this slot
        if (studentsRemaining <= 0) {
            // Commit Assignments
            for (const assignment of potentialAssignments) {
                context.assignments.push(assignment);
            }

            // RECURSE: Try to schedule the NEXT course
            if (solve(courses, classrooms, timeSlots, context, index + 1, startTime, timeoutMs)) {
                return true; // Found a valid full schedule!
            }

            // BACKTRACK: If next steps failed, undo these assignments and try next slot
            for (let i = 0; i < potentialAssignments.length; i++) {
                context.assignments.pop();
            }
        }
    }

    // No valid slot combination found for this course
    return false;
}

/**
 * Greedy scheduling algorithm - faster for large datasets.
 * Assigns each course to the first valid time slot/room combination.
 * O(courses * timeSlots * classrooms) - much faster than backtracking.
 * Returns both success status and detailed failure reason if failed.
 */
/**
 * Greedy scheduling algorithm with SPLIT SUPPORT.
 * Tries to fit a course into one OR MORE classrooms if needed.
 */
function solveGreedy(
    courses: Course[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[],
    context: ValidationContext
): { success: boolean; failureReason?: FailureReason } {
    console.log(`Greedy solver (Split-Enabled): ${courses.length} courses, ${timeSlots.length} slots.`);

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        let placed = false;

        // Her zaman dilimini dene
        for (const timeSlot of timeSlots) {
            if (placed) break;

            // 1. ADIM: Öğrenci çakışması (Student Conflict) var mı?
            // Herhangi bir odada bu dersi yapabilir miyiz diye genel bir kontrol yapalım.
            // Not: İlk odayı referans alıyoruz çünkü isSafe içindeki öğrenci kontrolü odadan bağımsızdır.
            if (!isSafe(course, classrooms[0], timeSlot, context)) {
                continue; // Öğrencilerin bu saatte başka sınavı var, bu saati geç.
            }

            // 2. ADIM: Bu saatteki BOŞ odaları bul
            const occupiedRoomIds = new Set(
                context.assignments
                .filter(a => a.timeSlot.id === timeSlot.id)
                .map(a => a.classroom.id)
            );

            // Boş odaları KAPASİTEYE göre BÜYÜKTEN KÜÇÜĞE sırala (Largest Fit)
            const availableRooms = classrooms
                .filter(r => !occupiedRoomIds.has(r.id))
                .sort((a, b) => b.capacity - a.capacity); 

            // 3. ADIM: Öğrencileri odalara dağıt (SPLIT MANTIĞI)
            let studentsRemaining = course.enrolledStudents;
            const roomsToUse: Classroom[] = [];

            for (const room of availableRooms) {
                if (studentsRemaining <= 0) break;

                // Odayı kullan listesine al
                roomsToUse.push(room);
                // Öğrencileri bu odaya doldur
                studentsRemaining -= room.capacity;
            }

            // 4. ADIM: Eğer tüm öğrenciler yerleştiyse (yani odalar yettiyse), atamayı yap
            if (studentsRemaining <= 0) {
                roomsToUse.forEach(room => {
                    context.assignments.push({
                        course: course,
                        classroom: room,
                        timeSlot: timeSlot
                    });
                });
                placed = true;
            }
        }

        if (!placed) {
            const failureReason = getFailureReason(course, classrooms, timeSlots, context, i, courses.length);
            console.log(`FAILED at course ${course.code}: Not enough room capacity (even with splitting) or time slots.`);
            return { success: false, failureReason };
        }
    }

    console.log(`SUCCESS: All ${courses.length} courses scheduled!`);
    return { success: true };
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

    // Diagnostic: Show time slot analysis
    const uniqueDays = new Set(timeSlots.map(t => t.dayIndex)).size;
    const slotsPerDay = timeSlots.length / uniqueDays;
    const maxParallelCapacity = timeSlots.length * classrooms.length;
    console.log('========== SCHEDULING CAPACITY ANALYSIS ==========');
    console.log(`📅 Days: ${uniqueDays}`);
    console.log(`⏰ Slots per day: ${slotsPerDay}`);
    console.log(`🏫 Total time slots: ${timeSlots.length}`);
    console.log(`🚪 Classrooms: ${classrooms.length}`);
    console.log(`📚 Courses to schedule: ${courses.length}`);
    console.log(`📊 Max theoretical capacity: ${maxParallelCapacity} (${timeSlots.length} slots × ${classrooms.length} rooms)`);
    console.log(`✅ Feasibility: ${maxParallelCapacity >= courses.length ? 'POSSIBLE' : 'IMPOSSIBLE - need more slots or rooms'}`);
    console.log('==================================================');

    // Sort courses by difficulty (Degree Heuristic)
    const sortedCourses = sortCoursesByDifficulty(courses);

    // Build lookup maps for efficient constraint checking
    const courseStudentMap = buildCourseStudentMap(students);
    const studentCourseMap = buildStudentCourseMap(students);

    // Diagnostic: Analyze student conflicts to estimate actual capacity needed
    let maxCoursesPerStudent = 0;
    let studentsWithMultipleCourses = 0;
    studentCourseMap.forEach((courseIds) => {
        if (courseIds.length > 1) studentsWithMultipleCourses++;
        maxCoursesPerStudent = Math.max(maxCoursesPerStudent, courseIds.length);
    });

    // With maxExamsPerDay constraint, a student with N courses needs at least ceil(N / maxExamsPerDay) days
    const maxExamsPerDay = constraints.maxExamsPerDay ?? 2;
    const minDaysNeeded = Math.ceil(maxCoursesPerStudent / maxExamsPerDay);
    const minSlotsNeeded = maxCoursesPerStudent; // Each course for that student needs a different slot

    console.log('========== STUDENT CONFLICT ANALYSIS ==========');
    console.log(`👥 Students with 2+ courses: ${studentsWithMultipleCourses}`);
    console.log(`📚 Max courses per student: ${maxCoursesPerStudent}`);
    console.log(`📅 Max exams per day allowed: ${maxExamsPerDay}`);
    console.log(`⚠️ Min days needed for busiest student: ${minDaysNeeded}`);
    console.log(`⚠️ Min SEQUENTIAL slots needed: ${minSlotsNeeded} (can't parallelize for same student)`);
    if (minSlotsNeeded > timeSlots.length) {
        console.log(`❌ PROBLEM: Need ${minSlotsNeeded} sequential slots but only have ${timeSlots.length}!`);
    }
    console.log('================================================');

    // Initialize validation context with configurable constraints
    const context: ValidationContext = {
        assignments: [],
        courseStudentMap,
        studentCourseMap,
        maxExamsPerDay,
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
            const failedCourseIndex = context.assignments.length;
            const failedCourse = sortedCourses[failedCourseIndex];
            failureDetails = getFailureReason(failedCourse, classrooms, timeSlots, context, failedCourseIndex, sortedCourses.length);
        }
    }

    const endTime = Date.now();

    if (!success) {
        // Build detailed error message
        let detailedMessage = timedOut
            ? '⏱️ TIMEOUT: The algorithm took too long searching for a valid schedule.\n'
            : '❌ SCHEDULING FAILED\n';

        if (failureDetails) {
            // Header with progress info
            detailedMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            detailedMessage += `📊 Progress: ${failureDetails.diagnostics.scheduledSoFar}/${failureDetails.totalCourses} courses scheduled\n`;
            detailedMessage += `🚫 Failed at: ${failureDetails.courseCode} (${failureDetails.courseEnrollment} students)\n`;
            detailedMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

            // Root cause (the main reason)
            detailedMessage += `\n🔍 ROOT CAUSE:\n`;
            detailedMessage += `   ${failureDetails.rootCause}\n`;

            // Suggestions with priority
            if (failureDetails.suggestions.length > 0) {
                detailedMessage += `\n💡 HOW TO FIX:\n`;
                failureDetails.suggestions.forEach((s, i) => {
                    const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
                    detailedMessage += `   ${icon} ${s.action}\n`;
                    detailedMessage += `      → ${s.impact}\n`;
                });
            }

            // Diagnostics summary
            detailedMessage += `\n📈 DIAGNOSTICS:\n`;
            detailedMessage += `   • Tested: ${failureDetails.diagnostics.testedSlots} slots × ${failureDetails.diagnostics.availableRooms} rooms\n`;
            detailedMessage += `   • Blocked by student conflicts: ${failureDetails.diagnostics.slotsBlockedByStudentConflicts} combinations\n`;
            detailedMessage += `   • Blocked by room conflicts: ${failureDetails.diagnostics.slotsBlockedByRoomConflicts} combinations\n`;
            if (failureDetails.diagnostics.roomsBlockedByCapacity > 0) {
                detailedMessage += `   • Rooms too small: ${failureDetails.diagnostics.roomsBlockedByCapacity}/${classrooms.length}\n`;
            }
        } else {
            detailedMessage += '\nNo detailed failure information available.';
        }

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
    // Use classroom.name as the classroomId since app.tsx maps classroom id to name
    const schedule: ExamSession[] = context.assignments.map((a, idx) => ({
        id: `exam_${idx + 1}`,
        courseId: a.course.id,
        classroomId: a.classroom.name,
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
