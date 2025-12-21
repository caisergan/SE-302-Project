const fs = require('fs');
const path = require('path');

const NUM_STUDENTS = 500;
const NUM_COURSES = 25;
const NUM_CLASSROOMS = 10;
const EXAMS_PER_STUDENT_MIN = 3;
const EXAMS_PER_STUDENT_MAX = 6;

const outputDir = path.join('sample_data', 'hard_set_5');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// --- DATA DEFINITIONS ---

// Courses: Some popular, some niche.
const courses = [];
for (let i = 1; i <= NUM_COURSES; i++) {
    const major = ['CS', 'EE', 'ARCH', 'IND', 'ART', 'URP'][Math.floor(Math.random() * 6)];
    const level = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)] * 100 + (i % 100);
    courses.push({
        id: `${major}${level}`,
        name: `${major} ${level} Course`,
    });
}

// Classrooms: Intentionally limited capacity to force splits
const classrooms = [];
const capacities = [25, 30, 30, 40, 40, 50, 50, 60, 75, 100]; // Total capacity is less than total students
for (let i = 1; i <= NUM_CLASSROOMS; i++) {
    classrooms.push({
        id: `R${i}`,
        name: `Room ${i}`,
        capacity: capacities[i-1],
    });
}


// Students
const students = [];
for (let i = 1; i <= NUM_STUDENTS; i++) {
    students.push({
        id: `S${1000 + i}`,
        name: `Student ${1000 + i}`,
    });
}

// --- ENROLLMENT GENERATION (The complex part) ---

const enrollments = [];
const studentEnrollmentCount = {};

// Create intentional conflict groups
const conflictGroup1 = ['CS101', 'CS102', 'CS201', 'CS202'];
const conflictGroup2 = ['EE101', 'EE102', 'EE201'];
const conflictGroup3 = ['ARCH301', 'ARCH302', 'URP301', 'ART101'];

// Assign some students to these conflict groups to create scheduling challenges
for (let i = 0; i < 150; i++) {
    const studentId = students[i].id;
    // Students taking all of group 1
    conflictGroup1.forEach(courseId => {
        enrollments.push({ studentId, courseId });
        studentEnrollmentCount[studentId] = (studentEnrollmentCount[studentId] || 0) + 1;
    });
}
for (let i = 150; i < 250; i++) {
    const studentId = students[i].id;
    // Students taking all of group 2
    conflictGroup2.forEach(courseId => {
        enrollments.push({ studentId, courseId });
        studentEnrollmentCount[studentId] = (studentEnrollmentCount[studentId] || 0) + 1;
    });
}
for (let i = 250; i < 350; i++) {
    const studentId = students[i].id;
    // Students taking all of group 3
    conflictGroup3.forEach(courseId => {
        enrollments.push({ studentId, courseId });
        studentEnrollmentCount[studentId] = (studentEnrollmentCount[studentId] || 0) + 1;
    });
}


// Fill remaining enrollments for all students
students.forEach(student => {
    const studentId = student.id;
    const currentExams = studentEnrollmentCount[studentId] || 0;
    const numExamsToTake = Math.floor(Math.random() * (EXAMS_PER_STUDENT_MAX - EXAMS_PER_STUDENT_MIN + 1)) + EXAMS_PER_STUDENT_MIN;
    
    let examsAdded = 0;
    while( (currentExams + examsAdded) < numExamsToTake) {
        const course = courses[Math.floor(Math.random() * courses.length)];
        const alreadyEnrolled = enrollments.some(e => e.studentId === studentId && e.courseId === course.id);
        
        if (!alreadyEnrolled) {
            enrollments.push({ studentId, courseId: course.id });
            examsAdded++;
        }
    }
});

// Force at least two courses to have very high enrollment to guarantee splits
const popularCourse1 = 'CS101';
const popularCourse2 = 'ARCH301';

for(let i = 350; i < NUM_STUDENTS; i++) {
    const studentId = students[i].id;
    if (!enrollments.some(e => e.studentId === studentId && e.courseId === popularCourse1)) {
        enrollments.push({ studentId, courseId: popularCourse1 });
    }
    if (i % 2 === 0 && !enrollments.some(e => e.studentId === studentId && e.courseId === popularCourse2)) {
         enrollments.push({ studentId, courseId: popularCourse2 });
    }
}


// --- CSV FILE WRITING ---

function writeCsv(fileName, data, headers) {
    const filePath = path.join(outputDir, fileName);
    const headerLine = headers.join(',') + '\n';
    const csvLines = data.map(row => headers.map(header => row[header]).join(',')).join('\n');
    fs.writeFileSync(filePath, headerLine + csvLines);
    console.log(`Successfully created ${fileName}`);
}

writeCsv('students.csv', students, ['id', 'name']);
writeCsv('classrooms.csv', classrooms, ['id', 'name', 'capacity']);
// Use course IDs from generation, not just the hardcoded ones
const finalCourses = [...new Set(enrollments.map(e => e.courseId))].map(id => {
    const found = courses.find(c => c.id === id);
    return { id, name: found ? found.name : `${id} Course`, code: id };
});
writeCsv('courses.csv', finalCourses, ['id', 'code', 'name']);
writeCsv('attendance.csv', enrollments.map(e => ({ student_id: e.studentId, course_id: e.courseId })), ['student_id', 'course_id']);

console.log('---');
// Log enrollment counts for verification
const courseEnrollmentCounts = {};
enrollments.forEach(e => {
    courseEnrollmentCounts[e.courseId] = (courseEnrollmentCounts[e.courseId] || 0) + 1;
});
console.log("Course Enrollment Counts (Top 10):");
Object.entries(courseEnrollmentCounts)
    .sort(([,a],[,b]) => b-a)
    .slice(0, 10)
    .forEach(([course, count]) => console.log(`${course}: ${count}`));

const maxCapacity = Math.max(...classrooms.map(c => c.capacity));
console.log(`\nMax classroom capacity: ${maxCapacity}`);
console.log("Courses guaranteed to require splits:");
Object.entries(courseEnrollmentCounts).forEach(([course, count]) => {
    if (count > maxCapacity) {
        console.log(`- ${course} (Enrolled: ${count})`);
    }
});

console.log(`\nDataset generation complete in ${outputDir}`);
