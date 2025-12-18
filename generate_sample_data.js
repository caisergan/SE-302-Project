/**
 * Generate sample data with CONTROLLED overlaps
 * Courses within same department share students (sequential scheduling)
 * Courses in different departments have NO overlap (parallel scheduling possible)
 */

const fs = require('fs');
const path = require('path');

// Configuration - smaller but demonstrates parallel scheduling
const DEPARTMENTS = ['CS', 'MATH', 'PHYS', 'CHEM', 'BIO'];
const COURSES_PER_DEPT = 10; // 50 total courses
const STUDENTS_PER_DEPT = 200; // 1000 total students (no overlap between depts)
const COURSES_PER_STUDENT = 4; // Within their department only
const NUM_ROOMS = 20;

// Generate courses
function generateCourses() {
    const courses = [];
    for (const dept of DEPARTMENTS) {
        for (let i = 1; i <= COURSES_PER_DEPT; i++) {
            courses.push(`${dept}${100 + i}`);
        }
    }
    return courses;
}

// Generate rooms
function generateRooms() {
    const rooms = [];
    const buildings = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < NUM_ROOMS; i++) {
        const building = buildings[i % buildings.length];
        const roomNum = 100 + i;
        const capacity = 50 + (i % 5) * 20; // 50-130 capacity
        rooms.push({ name: `${building}${roomNum}`, capacity });
    }
    return rooms;
}

// Generate enrollments - students ONLY in their department (NO cross-dept overlap)
function generateEnrollments() {
    const enrollments = new Map();
    let studentNum = 1;

    for (const dept of DEPARTMENTS) {
        // Get courses in this department
        const deptCourses = [];
        for (let i = 1; i <= COURSES_PER_DEPT; i++) {
            const code = `${dept}${100 + i}`;
            deptCourses.push(code);
            enrollments.set(code, []);
        }

        // Create students for this department only
        for (let s = 0; s < STUDENTS_PER_DEPT; s++) {
            const studentId = `STD${String(studentNum++).padStart(5, '0')}`;

            // Pick random courses from THIS department only
            const shuffled = [...deptCourses].sort(() => Math.random() - 0.5);
            const selectedCourses = shuffled.slice(0, COURSES_PER_STUDENT);

            for (const course of selectedCourses) {
                enrollments.get(course).push(studentId);
            }
        }
    }

    return enrollments;
}

// Write files
function writeFiles(courses, rooms, enrollments) {
    const outputDir = path.join(__dirname, 'sample_data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Courses
    fs.writeFileSync(
        path.join(outputDir, 'courses.csv'),
        'ALL OF THE COURSES IN THE SYSTEM\r\n' + courses.join('\r\n')
    );

    // Rooms
    fs.writeFileSync(
        path.join(outputDir, 'classrooms.csv'),
        'ALL OF THE CLASSROOMS; AND THEIR CAPACITIES IN THE SYSTEM\r\n' +
        rooms.map(r => `${r.name};${r.capacity}`).join('\r\n')
    );

    // Attendance
    let attendance = '';
    for (const [course, students] of enrollments) {
        attendance += `${course}\r\n`;
        attendance += `[${students.map(s => `'${s}'`).join(', ')}]\r\n\r\n`;
    }
    fs.writeFileSync(path.join(outputDir, 'attendance.csv'), attendance);

    console.log(`✅ Generated sample data with PARALLEL scheduling capability:`);
    console.log(`   ${courses.length} courses (${COURSES_PER_DEPT} per department)`);
    console.log(`   ${rooms.length} rooms`);
    console.log(`   ${STUDENTS_PER_DEPT * DEPARTMENTS.length} students`);
    console.log(`   Students only enrolled in their own department → NO cross-dept conflicts!`);
    console.log(`   → Courses from different departments CAN be at the same time`);
}

const courses = generateCourses();
const rooms = generateRooms();
const enrollments = generateEnrollments();
writeFiles(courses, rooms, enrollments);
