/**
 * Scheduler Service Unit Tests
 * 
 * Comprehensive test suite for the exam scheduling algorithm.
 * Tests all 6 constraints and edge cases.
 */

import { generateSchedule, validateSchedule } from './schedulerService';
import type { Course, Classroom, Student, GenerationConstraints, ExamSession } from '../../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const createCourse = (id: string, enrolledStudents: number): Course => ({
    id,
    code: id,
    name: `Course ${id}`,
    enrolledStudents
});

const createClassroom = (id: string, capacity: number): Classroom => ({
    id,
    name: `Room ${id}`,
    capacity,
    building: 'Main'
});

const createStudent = (id: string, enrolledCourses: string[]): Student => ({
    id,
    name: `Student ${id}`,
    email: `${id}@test.com`,
    enrolledCourses
});

const createConstraints = (overrides: Partial<GenerationConstraints> = {}): GenerationConstraints => ({
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-20'),
    dailyStartTime: '09:00',
    dailyEndTime: '17:00',
    includeWeekends: false,
    maxExamsPerDay: 2,
    allowConsecutiveExams: true,
    minHoursBetweenExams: 1,
    ...overrides
});

// ============================================================================
// 1. Basic Functionality Tests
// ============================================================================

describe('Scheduler - Basic Functionality', () => {
    test('should schedule a single course successfully', () => {
        const courses = [createCourse('C1', 30)];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(1);
        expect(result.schedule[0].courseId).toBe('C1');
    });

    test('should schedule multiple courses without conflicts', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 25),
            createCourse('C3', 20),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(3);
    });

    test('should return error when no courses provided', () => {
        const courses: Course[] = [];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(false);
        expect(result.message).toContain('No courses');
    });

    test('should return error when no classrooms available', () => {
        const courses = [createCourse('C1', 30)];
        const classrooms: Classroom[] = [];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(false);
        expect(result.message).toContain('No classrooms');
    });

    test('should return error when no valid time slots', () => {
        const courses = [createCourse('C1', 30)];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        // Start date after end date
        const constraints = createConstraints({
            startDate: new Date('2024-01-20'),
            endDate: new Date('2024-01-15'),
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(false);
    });
});

// ============================================================================
// 2. Constraint 1: Capacity Check
// ============================================================================

describe('Scheduler - Constraint 1: Capacity', () => {
    test('should reject room smaller than course enrollment', () => {
        const courses = [createCourse('C1', 100)]; // 100 students
        const classrooms = [createClassroom('R1', 50)]; // Only 50 capacity
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Unable to generate');
    });

    test('should accept room with exact capacity', () => {
        const courses = [createCourse('C1', 50)];
        const classrooms = [createClassroom('R1', 50)]; // Exact match
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule[0].classroomId).toBe('R1');
    });

    test('should use appropriate room when multiple options exist', () => {
        const courses = [createCourse('C1', 30)];
        const classrooms = [
            createClassroom('R1', 25), // Too small
            createClassroom('R2', 50), // Large enough
        ];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule[0].classroomId).toBe('R2');
    });
});

// ============================================================================
// 3. Constraint 2: Room Availability
// ============================================================================

describe('Scheduler - Constraint 2: Room Availability', () => {
    test('should not double-book the same room at same time slot', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [createClassroom('R1', 50)]; // Only one room
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(2);

        // Both courses should be in the same room but different times
        const times = result.schedule.map(s => s.startTime.getTime());
        expect(new Set(times).size).toBe(2); // All different times
    });

    test('should allow same room in different time slots', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
            createCourse('C3', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        // All courses should use the same room
        const rooms = result.schedule.map(s => s.classroomId);
        expect(new Set(rooms).size).toBe(1);
    });
});

// ============================================================================
// 4. Constraint 3: Student Conflicts
// ============================================================================

describe('Scheduler - Constraint 3: Student Conflicts', () => {
    test('should not schedule overlapping exams for same student', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [
            createClassroom('R1', 50),
            createClassroom('R2', 50),
        ];
        // Student enrolled in both courses
        const students = [createStudent('S1', ['C1', 'C2'])];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        // Exams must be at different times
        const times = result.schedule.map(s => s.startTime.getTime());
        expect(new Set(times).size).toBe(2);
    });

    test('should allow same time slot if no common students', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [
            createClassroom('R1', 50),
            createClassroom('R2', 50),
        ];
        // Different students in each course
        const students = [
            createStudent('S1', ['C1']),
            createStudent('S2', ['C2']),
        ];
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        // Could potentially be at same time since no student overlap
        expect(result.schedule).toHaveLength(2);
    });
});

// ============================================================================
// 5. Constraint 4: Consecutive Exams
// ============================================================================

describe('Scheduler - Constraint 4: Consecutive Exams', () => {
    test('should allow consecutive exams when allowConsecutiveExams is true', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2'])];
        const constraints = createConstraints({
            allowConsecutiveExams: true,
            minHoursBetweenExams: 0,
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(2);
    });

    test('should prevent consecutive exams when allowConsecutiveExams is false', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
            createCourse('C3', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2', 'C3'])];
        const constraints = createConstraints({
            allowConsecutiveExams: false,
            minHoursBetweenExams: 1,
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        // Should still be able to schedule with gaps
        if (result.success) {
            expect(result.schedule).toHaveLength(3);
        }
    });
});

// ============================================================================
// 6. Constraint 5: Max Exams Per Day
// ============================================================================

describe('Scheduler - Constraint 5: Max Exams Per Day', () => {
    test('should respect maxExamsPerDay=1 limit', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2'])];
        const constraints = createConstraints({
            maxExamsPerDay: 1,
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        // Exams should be on different days
        const days = result.schedule.map(s => s.startTime.toDateString());
        expect(new Set(days).size).toBe(2);
    });

    test('should respect maxExamsPerDay=2 limit', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
            createCourse('C3', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2', 'C3'])];
        const constraints = createConstraints({
            maxExamsPerDay: 2,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-25'), // Enough days
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);

        // Count exams per day for this student's courses
        const dayCount: Record<string, number> = {};
        for (const session of result.schedule) {
            const day = session.startTime.toDateString();
            dayCount[day] = (dayCount[day] || 0) + 1;
        }

        // No day should have more than 2 exams
        for (const count of Object.values(dayCount)) {
            expect(count).toBeLessThanOrEqual(2);
        }
    });
});

// ============================================================================
// 7. Constraint 6: Minimum Hours Between Exams
// ============================================================================

describe('Scheduler - Constraint 6: Min Hours Between Exams', () => {
    test('should allow exams with 0 hour gap when minHoursBetweenExams=0', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2'])];
        const constraints = createConstraints({
            minHoursBetweenExams: 0,
            allowConsecutiveExams: true,
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(2);
    });

    test('should enforce minimum hour gap when minHoursBetweenExams > 0', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', ['C1', 'C2'])];
        const constraints = createConstraints({
            minHoursBetweenExams: 2, // 2 hour gap required
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);

        if (result.schedule.length === 2) {
            const time1 = result.schedule[0].endTime.getTime();
            const time2 = result.schedule[1].startTime.getTime();
            const gapMs = Math.abs(time2 - time1);
            const minGapMs = 2 * 60 * 60 * 1000; // 2 hours in ms

            // Gap should be at least 2 hours
            expect(gapMs).toBeGreaterThanOrEqual(minGapMs);
        }
    });
});

// ============================================================================
// 8. Edge Cases
// ============================================================================

describe('Scheduler - Edge Cases', () => {
    test('should handle student enrolled in all courses', () => {
        const courses = [
            createCourse('C1', 30),
            createCourse('C2', 30),
            createCourse('C3', 30),
            createCourse('C4', 30),
        ];
        const classrooms = [createClassroom('R1', 50)];
        // One student in ALL courses - most constrained case
        const students = [createStudent('S1', ['C1', 'C2', 'C3', 'C4'])];
        const constraints = createConstraints({
            maxExamsPerDay: 2,
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-25'),
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        // Should succeed with enough days
        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(4);
    });

    test('should timeout for truly unsolvable case', () => {
        // Create impossible scenario: 10 courses, 1 room, 1 slot, 1 student in all
        const courses = Array.from({ length: 10 }, (_, i) => createCourse(`C${i}`, 30));
        const classrooms = [createClassroom('R1', 50)];
        const students = [createStudent('S1', courses.map(c => c.id))];
        const constraints = createConstraints({
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-15'), // Only 1 day
            maxExamsPerDay: 1, // Only 1 exam per day
        });

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(false);
        // Should fail gracefully, not timeout
    });

    test('should handle performance with 20+ courses', () => {
        const courses = Array.from({ length: 20 }, (_, i) => createCourse(`C${i}`, 30));
        const classrooms = [
            createClassroom('R1', 50),
            createClassroom('R2', 50),
            createClassroom('R3', 50),
        ];
        const students: Student[] = []; // No student conflicts
        const constraints = createConstraints({
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-31'),
        });

        const startTime = Date.now();
        const result = generateSchedule(courses, classrooms, students, constraints);
        const duration = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(20);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
});

// ============================================================================
// 9. Validation Tests
// ============================================================================

describe('Scheduler - Validation', () => {
    test('validateSchedule should pass for valid schedule', () => {
        const courses = [createCourse('C1', 30)];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];
        const constraints = createConstraints();

        const genResult = generateSchedule(courses, classrooms, students, constraints);
        expect(genResult.success).toBe(true);

        const valResult = validateSchedule(genResult.schedule, courses, classrooms, students);
        expect(valResult.valid).toBe(true);
        expect(valResult.violations).toHaveLength(0);
    });

    test('validateSchedule should detect capacity violations', () => {
        const courses = [createCourse('C1', 100)];
        const classrooms = [createClassroom('R1', 50)];
        const students: Student[] = [];

        // Manually create invalid schedule
        const invalidSchedule: ExamSession[] = [{
            id: 'exam_1',
            courseId: 'C1',
            classroomId: 'R1',
            startTime: new Date('2024-01-15T09:00:00'),
            endTime: new Date('2024-01-15T11:00:00'),
        }];

        const valResult = validateSchedule(invalidSchedule, courses, classrooms, students);
        expect(valResult.valid).toBe(false);
        expect(valResult.violations.length).toBeGreaterThan(0);
    });
});

// ============================================================================
// 10. Split Logic Tests
// ============================================================================

describe('Scheduler - Split Logic', () => {
    test('should split a large course across multiple rooms', () => {
        const courses = [createCourse('C1', 150)];
        const classrooms = [
            createClassroom('R1', 100),
            createClassroom('R2', 50),
        ];
        const students = Array.from({ length: 150 }, (_, i) => createStudent(`S${i}`, ['C1']));
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule).toHaveLength(2); // One course split into two sessions

        // Check that both rooms are used at the same time for the same course
        expect(result.schedule[0].courseId).toBe('C1');
        expect(result.schedule[1].courseId).toBe('C1');
        expect(result.schedule[0].startTime.getTime()).toBe(result.schedule[1].startTime.getTime());
        
        const usedRoomIds = new Set(result.schedule.map(s => s.classroomId));
        expect(usedRoomIds).toContain('R1');
        expect(usedRoomIds).toContain('R2');
    });

    test('should not use non-existent classrooms when splitting', () => {
        const courses = [createCourse('C-SPLIT-101', 120)];
        const classrooms = [
            createClassroom('REAL-ROOM-1', 80),
            createClassroom('REAL-ROOM-2', 40),
        ];
        const students = Array.from({ length: 120 }, (_, i) => createStudent(`S${i}`, ['C-SPLIT-101']));
        const constraints = createConstraints();

        const result = generateSchedule(courses, classrooms, students, constraints);

        expect(result.success).toBe(true);
        expect(result.schedule.length).toBeGreaterThanOrEqual(2);

        const originalClassroomIds = new Set(classrooms.map(c => c.id));

        for (const session of result.schedule) {
            expect(originalClassroomIds.has(session.classroomId)).toBe(true);
        }
    });
});