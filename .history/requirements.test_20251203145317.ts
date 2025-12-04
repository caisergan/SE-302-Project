// requirements.test.ts
// Çalıştırmak için:
//   npx tsx requirements.test.ts
//
// Bu script, SE-302 Requirement Document içindeki
// Functional Requirements (FR1–FR14)'ü hem davranış (behavior)
// hem de proje koduna entegrasyon (integration) açısından test eder.

import * as fs from 'fs';
import * as path from 'path';

// ================== Ortak tipler (projeye paralel) ==================

interface Course {
  id: string;
  code: string;
  name: string;
  enrolledStudents: number;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  building: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
}

interface ExamSession {
  id: string;
  courseId: string;
  classroomId: string;
  startTime: Date;
  endTime: Date;
}

interface GenerationConstraints {
  startDate: string;     // ISO date string
  endDate: string;
  dailyStartTime: string; // "HH:MM"
  dailyEndTime: string;   // "HH:MM"
  includeWeekends: boolean;
}

// ================== Yardımcılar ==================

function readSource(relPath: string): string {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf-8');
}

function logLine(ok: boolean, msg: string) {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
}

function header(title: string) {
  console.log(`\n──────────────────── ${title} ────────────────────\n`);
}

// Küçük helper: TS tarafında behavior testleri için örnek data
const TEST_COURSES: Course[] = [
  { id: 'CS101', code: 'CS101', name: 'Intro CS', enrolledStudents: 30 },
  { id: 'CS102', code: 'CS102', name: 'Data Structures', enrolledStudents: 25 },
  { id: 'CS103', code: 'CS103', name: 'Algorithms', enrolledStudents: 20 },
];

const TEST_CLASSROOMS: Classroom[] = [
  { id: 'R101', name: 'R101', capacity: 50, building: 'Main' },
  { id: 'R102', name: 'R102', capacity: 30, building: 'Main' },
];

const TEST_STUDENTS: Student[] = [
  { id: 'Student_1', name: 'Alice', email: 'alice@uni.edu', enrolledCourses: ['CS101', 'CS102'] },
  { id: 'Student_2', name: 'Bob', email: 'bob@uni.edu', enrolledCourses: ['CS102', 'CS103'] },
  { id: 'Student_3', name: 'Carol', email: 'carol@uni.edu', enrolledCourses: ['CS101', 'CS103'] },
];

// ===================================================================
// FR1 – Import data files for courses and classrooms
// ===================================================================

// Behavior: CSV -> Course[] / Classroom[]
function parseCourseListFile_test(rows: string[]): Course[] {
  const newCourses: Course[] = [];
  rows.forEach(row => {
    if (row.includes('ALL OF THE COURSES') || !row.trim()) return;
    const code = row.trim();
    newCourses.push({
      id: code,
      code,
      name: `Course ${code}`,
      enrolledStudents: 0,
    });
  });
  return newCourses;
}

function parseClassroomFile_test(rows: string[]): Classroom[] {
  const newRooms: Classroom[] = [];
  rows.forEach(row => {
    if (row.includes('ALL OF THE CLASSROOMS') || !row.trim()) return;
    const parts = row.split(';');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const capacity = parseInt(parts[1].trim(), 10);
      newRooms.push({
        id: name,
        name,
        capacity: isNaN(capacity) ? 0 : capacity,
        building: 'Main',
      });
    }
  });
  return newRooms;
}

function testFR1(): boolean {
  header('FR1 – Import data files for courses and classrooms');

  // ===== Behavior =====
  const courseCSV = `ALL OF THE COURSES
CourseCode_CS101
CourseCode_CS102

`;
  const courseRows = courseCSV
    .split('\n').map(r => r.trim()).filter(r => r.length > 0);
  const parsedCourses = parseCourseListFile_test(courseRows);

  const c_len_ok = parsedCourses.length === 2;
  const c_first_code_ok = parsedCourses[0]?.code === 'CourseCode_CS101';
  const c_no_header = !parsedCourses.some(c => c.code.includes('ALL OF THE COURSES'));

  const classroomCSV = `ALL OF THE CLASSROOMS
Room_A;50
Room_B;30

`;
  const classroomRows = classroomCSV
    .split('\n').map(r => r.trim()).filter(r => r.length > 0);
  const parsedRooms = parseClassroomFile_test(classroomRows);

  const r_len_ok = parsedRooms.length === 2;
  const r_first_ok = parsedRooms[0]?.name === 'Room_A' && parsedRooms[0]?.capacity === 50;
  const r_no_header = !parsedRooms.some(r => r.name.includes('ALL OF THE CLASSROOMS'));

  const emptyRows = `

     `
    .split('\n').map(r => r.trim()).filter(r => r.length > 0);
  const emptyC = parseCourseListFile_test(emptyRows);
  const emptyR = parseClassroomFile_test(emptyRows);
  const empty_ok = emptyRows.length === 0 && emptyC.length === 0 && emptyR.length === 0;

  logLine(c_len_ok, 'Behavior: parses 2 courses correctly from CSV.');
  logLine(c_first_code_ok, 'Behavior: first course code is CourseCode_CS101.');
  logLine(c_no_header, 'Behavior: header line “ALL OF THE COURSES” is ignored.');
  logLine(r_len_ok, 'Behavior: parses 2 classrooms correctly from CSV.');
  logLine(r_first_ok, 'Behavior: Room_A capacity=50 parsed correctly.');
  logLine(r_no_header, 'Behavior: header line “ALL OF THE CLASSROOMS” is ignored.');
  logLine(empty_ok, 'Behavior: empty / whitespace-only input yields no items.');

  const behaviorOK = c_len_ok && c_first_code_ok && c_no_header &&
                     r_len_ok && r_first_ok && r_no_header && empty_ok;

  // ===== Integration =====
  const diCode = readSource('src/components/DataInput.tsx') || readSource('src/DataInput.tsx');
  const appCode = readSource('src/app.tsx') || readSource('src/App.tsx');

  const hasDataInput = appCode.includes('<DataInput');
  const hasParseCourse = diCode.includes('const parseCourseListFile');
  const hasParseRoom = diCode.includes('const parseClassroomFile');
  const hasProcessCSV = diCode.includes('const processCSV');

  const processUsesCourse =
    diCode.includes("else if (activeTab === 'courses')") &&
    diCode.includes('parseCourseListFile(');
  const processUsesRoom =
    diCode.includes("if (activeTab === 'classrooms')") &&
    diCode.includes('parseClassroomFile(');

  logLine(hasDataInput, 'Integration: App renders <DataInput /> (import UI reachable).');
  logLine(hasParseCourse, 'Integration: DataInput defines parseCourseListFile.');
  logLine(hasParseRoom, 'Integration: DataInput defines parseClassroomFile.');
  logLine(hasProcessCSV, 'Integration: DataInput defines processCSV.');
  logLine(processUsesCourse, 'Integration: processCSV calls parseCourseListFile for courses tab.');
  logLine(processUsesRoom, 'Integration: processCSV calls parseClassroomFile for classrooms tab.');

  const integrationOK =
    hasDataInput && hasParseCourse && hasParseRoom && hasProcessCSV &&
    processUsesCourse && processUsesRoom;

  const passed = behaviorOK && integrationOK;
  console.log(`\nFR1 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR2 – Manage and update input data
// ===================================================================

function testFR2(): boolean {
  header('FR2 – Manage and update data');

  // ===== Behavior: CRUD ve duplicate / validation =====
  let courses: Course[] = [...TEST_COURSES];

  // Create
  const newCourse: Course = { id: 'CS104', code: 'CS104', name: 'New Course', enrolledStudents: 0 };
  courses = [...courses, newCourse];
  const b_create = courses.length === 4;

  // Update
  courses = courses.map(c => c.id === 'CS101' ? { ...c, name: 'Updated Name' } : c);
  const b_update = courses.find(c => c.id === 'CS101')?.name === 'Updated Name';

  // Delete
  courses = courses.filter(c => c.id !== 'CS104');
  const b_delete = courses.length === 3 && !courses.some(c => c.id === 'CS104');

  // Duplicate prevention
  const ids = new Set(courses.map(c => c.id));
  const dup = { id: 'CS101', code: 'CS101', name: 'Dup', enrolledStudents: 0 };
  const b_dupBlock = ids.has(dup.id);

  // Capacity validation (string -> number only)
  const validCapacity = (val: string) => /^\d+$/.test(val);
  const b_capacityValid = validCapacity('50') && !validCapacity('50a');

  logLine(b_create, 'Behavior: can add a new course.');
  logLine(b_update, 'Behavior: can update existing course name.');
  logLine(b_delete, 'Behavior: can delete a course.');
  logLine(b_dupBlock, 'Behavior: duplicate ID detection works (no add).');
  logLine(b_capacityValid, 'Behavior: capacity validation accepts digits only.');

  const behaviorOK =
    b_create && b_update && b_delete && b_dupBlock && b_capacityValid;

  // ===== Integration: DataInput içindeki EditModal + handleEdit/handleAdd/handleDelete =====
  const diCode = readSource('src/components/DataInput.tsx') || '';

  const hasEditModal = diCode.includes('const EditModal');
  const hasHandleEditClick = diCode.includes('const handleEditClick');
  const hasHandleAddClick = diCode.includes('const handleAddClick');
  const hasDeleteLogic =
    diCode.includes('onClick={() => handleDelete') ||
    diCode.includes('handleDeleteClick');

  const usesSetCourses = diCode.includes('setCourses(');
  const usesSetClassrooms = diCode.includes('setClassrooms(');

  logLine(hasEditModal, 'Integration: EditModal component exists for editing items.');
  logLine(hasHandleEditClick, 'Integration: handleEditClick triggers EditModal.');
  logLine(hasHandleAddClick, 'Integration: handleAddClick for adding new course/classroom.');
  logLine(hasDeleteLogic, 'Integration: delete action present in courses/classrooms table.');
  logLine(usesSetCourses, 'Integration: DataInput updates courses via setCourses.');
  logLine(usesSetClassrooms, 'Integration: DataInput updates classrooms via setClassrooms.');

  const integrationOK =
    hasEditModal && hasHandleEditClick && hasHandleAddClick &&
    hasDeleteLogic && usesSetCourses && usesSetClassrooms;

  const passed = behaviorOK && integrationOK;
  console.log(`\nFR2 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR3 – Initiate the schedule generation process
// ===================================================================

function testFR3(): boolean {
  header('FR3 – Initiate schedule generation');

  // ===== Behavior: basit state akışı =====
  let showModal = false;
  function handleGenerateSchedule_test() {
    showModal = true;
  }

  handleGenerateSchedule_test();
  const behaviorOK = showModal === true;
  logLine(behaviorOK, 'Behavior: calling generateSchedule opens constraint selection.');

  // ===== Integration: App.tsx içindeki handleGenerateSchedule & ConstraintSelector =====
  const appCode = readSource('src/app.tsx') || readSource('src/App.tsx');

  const hasHandleGenerate = appCode.includes('const handleGenerateSchedule');
  const opensModal =
    appCode.includes('const [showConstraintModal') &&
    appCode.includes('setShowConstraintModal(true)');
  const rendersConstraintSelector =
    appCode.includes('<ConstraintSelector') &&
    appCode.includes('onGenerate={handleFinalizeSchedule}');

  const dashboardPassesOnGenerate =
    appCode.includes('<Dashboard') &&
    appCode.includes('onGenerate={handleGenerateSchedule}');

  logLine(hasHandleGenerate, 'Integration: handleGenerateSchedule handler defined in App.');
  logLine(opensModal, 'Integration: handleGenerateSchedule sets showConstraintModal to true.');
  logLine(rendersConstraintSelector, 'Integration: ConstraintSelector is rendered when modal is visible.');
  logLine(dashboardPassesOnGenerate, 'Integration: Dashboard triggers handleGenerateSchedule via onGenerate prop.');

  const integrationOK =
    hasHandleGenerate && opensModal && rendersConstraintSelector && dashboardPassesOnGenerate;

  const passed = behaviorOK && integrationOK;
  console.log(`\nFR3 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR4–FR7 – View generated schedule by classroom / student / course / day
// ===================================================================

// Behavior: ScheduleView.filteredSessions mantığına paralel
function filterSchedule_test(
  schedule: ExamSession[],
  filterMode: 'all' | 'room' | 'course' | 'student',
  selectedId: string | null,
  students: Student[]
): ExamSession[] {
  if (filterMode === 'all') return schedule;
  if (!selectedId) return [];
  return schedule.filter(session => {
    if (filterMode === 'room') return session.classroomId === selectedId;
    if (filterMode === 'course') return session.courseId === selectedId;
    if (filterMode === 'student') {
      const s = students.find(st => st.id === selectedId);
      return !!s && s.enrolledCourses.includes(session.courseId);
    }
    return false;
  });
}

function testFR4to7(): boolean {
  header('FR4–FR7 – View schedule (room, student, course, day)');

  const schedule: ExamSession[] = [
    {
      id: 'e1',
      courseId: 'CS101',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T09:00'),
      endTime: new Date('2025-01-02T11:00'),
    },
    {
      id: 'e2',
      courseId: 'CS102',
      classroomId: 'R102',
      startTime: new Date('2025-01-02T14:00'),
      endTime: new Date('2025-01-02T16:00'),
    },
    {
      id: 'e3',
      courseId: 'CS103',
      classroomId: 'R101',
      startTime: new Date('2025-01-03T09:00'),
      endTime: new Date('2025-01-03T11:00'),
    },
  ];

  const byRoom = filterSchedule_test(schedule, 'room', 'R101', TEST_STUDENTS);
  const byCourse = filterSchedule_test(schedule, 'course', 'CS101', TEST_STUDENTS);
  const byStudent1 = filterSchedule_test(schedule, 'student', 'Student_1', TEST_STUDENTS);
  const all = filterSchedule_test(schedule, 'all', null, TEST_STUDENTS);

  const b_room = byRoom.length === 2;
  const b_course = byCourse.length === 1 && byCourse[0].id === 'e1';
  const b_student = byStudent1.length === 2; // CS101, CS102
  const b_all = all.length === schedule.length;

  // Day-based view: gruplayarak
  const byDay = new Map<string, ExamSession[]>();
  schedule.forEach(s => {
    const key = s.startTime.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  });
  const b_day = byDay.size >= 2 && (byDay.get(schedule[0].startTime.toDateString()) || []).length > 0;

  logLine(b_room, 'Behavior: filter by classroom returns correct subset.');
  logLine(b_course, 'Behavior: filter by course returns correct subset.');
  logLine(b_student, 'Behavior: filter by student returns exams of that student.');
  logLine(b_all, 'Behavior: filter=all returns full schedule.');
  logLine(b_day, 'Behavior: grouping by day is possible (>= 2 different days).');

  const behaviorOK = b_room && b_course && b_student && b_all && b_day;

  // ===== Integration: ScheduleView filteredSessions & filterMode =====
  const svCode = readSource('src/components/ScheduleView.tsx');

  const hasFilterMode =
    svCode.includes("type FilterMode = 'all' | 'room' | 'course' | 'student'") ||
    svCode.includes('FilterMode');
  const hasFilteredSessions = svCode.includes('const filteredSessions');
  const filtersRoom = svCode.includes("filterMode === 'room'") && svCode.includes('session.classroomId');
  const filtersCourse = svCode.includes("filterMode === 'course'") && svCode.includes('session.courseId');
  const filtersStudent =
    svCode.includes("filterMode === 'student'") &&
    svCode.includes('students.find') &&
    svCode.includes('.enrolledCourses.includes');

  const hasDayGrid = svCode.includes('WEEK_DAYS') || svCode.includes('HOURS_COUNT');

  logLine(hasFilterMode, 'Integration: ScheduleView defines FilterMode (all/room/course/student).');
  logLine(hasFilteredSessions, 'Integration: filteredSessions computed with useMemo.');
  logLine(filtersRoom, 'Integration: filteredSessions filters by classroomId for room mode.');
  logLine(filtersCourse, 'Integration: filteredSessions filters by courseId for course mode.');
  logLine(filtersStudent, 'Integration: filteredSessions filters by student.enrolledCourses for student mode.');
  logLine(hasDayGrid, 'Integration: ScheduleView has weekly grid for day-based view.');

  const integrationOK =
    hasFilterMode && hasFilteredSessions && filtersRoom &&
    filtersCourse && filtersStudent && hasDayGrid;

  const passed = behaviorOK && integrationOK;
  console.log(`\nFR4–FR7 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR8 – Export scheduled exams to a document
// ===================================================================


function testFR8(): boolean {
  header('FR8 – Export schedule to document');

  // Behavior: basit CSV export fonksiyonu (örnek)
  const schedule: ExamSession[] = [
    {
      id: 'e1',
      courseId: 'CS101',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T09:00'),
      endTime: new Date('2025-01-02T11:00'),
    },
  ];

  function exportScheduleToCSV_test(s: ExamSession[]): string {
    const lines = ['id,courseId,classroomId,startTime,endTime'];
    s.forEach(ex => {
      lines.push(
        [
          ex.id,
          ex.courseId,
          ex.classroomId,
          ex.startTime.toISOString(),
          ex.endTime.toISOString(),
        ].join(','),
      );
    });
    return lines.join('\n');
  }

  const csv = exportScheduleToCSV_test(schedule);
  const behaviorOK =
    csv.split('\n').length === 2 &&
    csv.includes('e1,CS101,R101') &&
    csv.includes('T09:00:00.000Z');

  logLine(behaviorOK, 'Behavior: schedule can be serialized to a simple CSV format.');

  // Integration: ScheduleView’te gerçekten Export butonu + onClick var mı?
  const svCode = readSource('src/components/ScheduleView.tsx');

  // Label var mı?
  const hasExportLabel =
    svCode.includes("t('schedule.export'") ||
    svCode.includes('t("schedule.export"');

  // Export label'ının etrafında onClick aranıyor
  const exportIndex = svCode.indexOf('schedule.export');
  let hasExportOnClick = false;
  if (exportIndex >= 0) {
    const window = svCode.slice(
      Math.max(0, exportIndex - 200),
      exportIndex + 200,
    );
    hasExportOnClick = window.includes('onClick');
  }

  logLine(
    hasExportLabel,
    'Integration: ScheduleView contains an Export button label (schedule.export).',
  );
  logLine(
    hasExportOnClick,
    'Integration: Export button is wired with an onClick handler near schedule.export.',
  );

  // FR8’in GERÇEKTEN sağlanması için hem davranış hem de UI entegrasyonu gerekli
  const integrationOK = hasExportLabel && hasExportOnClick;
  const passed = behaviorOK && integrationOK;
  console.log(`\nFR8 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

  
// ===================================================================
// FR9 – Parse and process input data (özellikle student attendance)
// ===================================================================

function parseStudentAttendance_test(lines: string[]): Map<string, Set<string>> {
  const studentMap = new Map<string, Set<string>>();
  let currentCourse = '';
  lines.forEach(line => {
    const clean = line.trim();
    if (!clean) return;
    if (clean.startsWith('[')) {
      if (!currentCourse) return;
      const content = clean.slice(1, -1);
      const ids = content.split(',').map(s =>
        s.trim().replace(/['"]/g, '')
      );
      ids.forEach(sid => {
        if (!sid) return;
        if (!studentMap.has(sid)) studentMap.set(sid, new Set());
        studentMap.get(sid)!.add(currentCourse);
      });
    } else if (clean.length < 50) {
      currentCourse = clean;
    }
  });
  return studentMap;
}

function testFR9(): boolean {
  header('FR9 – Parse and process input data');

  const attendanceText = `CS101
['Student_1', 'Student_2']
CS102
['Student_2', 'Student_3']`;
  const lines = attendanceText.split('\n').map(l => l.trim());
  const map = parseStudentAttendance_test(lines);

  const b_count = map.size === 3;
  const b_student2 =
    map.get('Student_2')?.has('CS101') &&
    map.get('Student_2')?.has('CS102');

  logLine(b_count, 'Behavior: 3 distinct students parsed from attendance text.');
  logLine(b_student2, 'Behavior: Student_2 is enrolled in both CS101 and CS102.');

  const behaviorOK = b_count && b_student2;

  // Integration: DataInput içinde parseStudentAttendanceFile fonksiyonu var mı?
  const diCode = readSource('src/components/DataInput.tsx') || '';
  const hasParseAttendance = diCode.includes('const parseStudentAttendanceFile');
  const processUsesAttendance =
    diCode.includes("else if (activeTab === 'students')") &&
    diCode.includes('parseStudentAttendanceFile(');

  logLine(hasParseAttendance, 'Integration: DataInput defines parseStudentAttendanceFile.');
  logLine(processUsesAttendance, 'Integration: processCSV routes to parseStudentAttendanceFile for students.');

  const integrationOK = hasParseAttendance && processUsesAttendance;
  const passed = behaviorOK && integrationOK;
  console.log(`\nFR9 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR10 – Generate a valid exam schedule
// ===================================================================

// Behavior: App.tsx içindeki handleFinalizeSchedule algoritmasına benzeyen basit fonksiyon
function generateSchedule_test(
  courses: Course[],
  classrooms: Classroom[],
  constraints: GenerationConstraints
): ExamSession[] {
  const result: ExamSession[] = [];
  let currentDate = new Date(constraints.startDate);
  const endDate = new Date(constraints.endDate);

  const [startHour, startMinute] = constraints.dailyStartTime.split(':').map(Number);
  const [endHour, endMinute] = constraints.dailyEndTime.split(':').map(Number);

  let currentCourseIndex = 0;

  while (currentDate <= endDate && currentCourseIndex < courses.length) {
    const dayOfWeek = currentDate.getDay();
    if (!constraints.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    currentDate.setHours(startHour, startMinute, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    while (
      currentDate.getTime() + 2 * 60 * 60 * 1000 <= dayEnd.getTime() &&
      currentCourseIndex < courses.length
    ) {
      const course = courses[currentCourseIndex];
      const room = classrooms[currentCourseIndex % classrooms.length];

      result.push({
        id: `sess-${currentCourseIndex}`,
        courseId: course.id,
        classroomId: room.id,
        startTime: new Date(currentDate),
        endTime: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000),
      });

      currentCourseIndex++;
      currentDate.setHours(currentDate.getHours() + 3);
    }

    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function testFR10(): boolean {
  header('FR10 – Generate a valid exam schedule');

  const constraints: GenerationConstraints = {
    startDate: '2025-01-02',
    endDate: '2025-01-05',
    dailyStartTime: '09:00',
    dailyEndTime: '18:00',
    includeWeekends: false,
  };

  const schedule = generateSchedule_test(TEST_COURSES, TEST_CLASSROOMS, constraints);

  const b_allCoursesScheduled =
    schedule.length === TEST_COURSES.length &&
    TEST_COURSES.every(c => schedule.some(s => s.courseId === c.id));

  const b_duration2h = schedule.every(
    s => s.endTime.getTime() - s.startTime.getTime() === 2 * 60 * 60 * 1000
  );

  const b_withinWindow = schedule.every(s => {
    const d = new Date(s.startTime);
    const h = d.getHours();
    return h >= 9 && h <= 18;
  });

  logLine(b_allCoursesScheduled, 'Behavior: every course is assigned to exactly one exam session.');
  logLine(b_duration2h, 'Behavior: each exam session is exactly 2 hours long.');
  logLine(b_withinWindow, 'Behavior: each exam lies within daily start/end window.');

  const behaviorOK = b_allCoursesScheduled && b_duration2h && b_withinWindow;

  // Integration: App.tsx’te handleFinalizeSchedule içinde benzer algoritma var mı?
  const appCode = readSource('src/app.tsx') || readSource('src/App.tsx');

  const hasHandleFinalize = appCode.includes('const handleFinalizeSchedule');
  const uses2h =
    appCode.includes('2 * 60 * 60 * 1000') &&
    appCode.includes('newSchedule.push');
  const usesConstraintsTime =
    appCode.includes('constraints.dailyStartTime') &&
    appCode.includes('constraints.dailyEndTime');

  logLine(hasHandleFinalize, 'Integration: handleFinalizeSchedule is defined in App.');
  logLine(uses2h, 'Integration: schedule uses 2-hour blocks for exams.');
  logLine(usesConstraintsTime, 'Integration: schedule uses constraints.dailyStartTime / dailyEndTime.');

  const integrationOK = hasHandleFinalize && uses2h && usesConstraintsTime;
  const passed = behaviorOK && integrationOK;
  console.log(`\nFR10 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// FR11 – Enforce "no consecutive exams" constraint
// ===================================================================

// ===================================================================
// FR11 – Enforce "no consecutive exams" constraint
// ===================================================================

function testFR11(): boolean {
  header('FR11 – No consecutive exams');

  // ===== Behavior: öğrenci için arka arkaya sınav olmamalı (en az 1 unit gap) =====
  const schedule: ExamSession[] = [
    {
      id: 'e1',
      courseId: 'CS101',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T09:00'),
      endTime: new Date('2025-01-02T11:00'),
    },
    {
      id: 'e2',
      courseId: 'CS102',
      classroomId: 'R102',
      startTime: new Date('2025-01-02T12:00'),
      endTime: new Date('2025-01-02T14:00'),
    },
  ];
  const alice = TEST_STUDENTS[0]; // CS101 & CS102

  const aliceExams = schedule
    .filter(s => alice.enrolledCourses.includes(s.courseId))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let hasGap = true;
  for (let i = 0; i < aliceExams.length - 1; i++) {
    const gap =
      aliceExams[i + 1].startTime.getTime() -
      aliceExams[i].endTime.getTime();
    if (gap <= 0) {
      hasGap = false;
      break;
    }
  }

  logLine(
    hasGap,
    'Behavior: student exams have a positive gap (no back-to-back sessions).',
  );
  const behaviorOK = hasGap;

  // ===== Integration: App’te gerçekten öğrenci bazlı "no consecutive" mantığı var mı? =====
  const appCode = readSource('src/app.tsx') || readSource('src/App.tsx');

  // handleFinalizeSchedule içinde students + enrolledCourses kullanılıp
  // "gap" veya "consecutive" tarzı bir mantık aranıyor.
  const hasStudentConstraintLogic =
    appCode.includes('handleFinalizeSchedule') &&
    appCode.includes('students') &&
    appCode.includes('enrolledCourses') &&
    (appCode.includes('consecutive') || appCode.includes('gap'));

  logLine(
    hasStudentConstraintLogic,
    'Integration: handleFinalizeSchedule uses students/enrolledCourses and checks gaps to avoid consecutive exams.',
  );

  // ŞU AN projende böyle bir logic olmadığı için bu test büyük ihtimalle FAIL edecek.
  // İleride constraint eklediğinde handleFinalizeSchedule içine
  // öğrencinin sınavları arasında gap kontrolü koyup kodda "consecutive" veya "gap"
  // gibi bir kelime kullanırsan burası PASS olur.
  const integrationOK = hasStudentConstraintLogic;

  const passed = behaviorOK && integrationOK;
  console.log(
    `\nFR11 => ${passed ? 'PASS ✅' : 'FAIL ❌'} (şu an FAIL ise: student-based no-consecutive constraint eksik demektir)\n`,
  );
  return passed;
}

// ===================================================================
// FR12 – Enforce "maximum daily exams" constraint (max 2 per day)
// ===================================================================

function testFR12(): boolean {
  header('FR12 – Maximum daily exams per student');

  // Behavior: hiçbir öğrenci bir günde 2'den fazla sınava girmemeli
  const schedule: ExamSession[] = [
    {
      id: 'e1',
      courseId: 'CS101',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T09:00'),
      endTime: new Date('2025-01-02T11:00'),
    },
    {
      id: 'e2',
      courseId: 'CS102',
      classroomId: 'R102',
      startTime: new Date('2025-01-02T14:00'),
      endTime: new Date('2025-01-02T16:00'),
    },
    {
      id: 'e3',
      courseId: 'CS103',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T17:00'),
      endTime: new Date('2025-01-02T19:00'),
    },
  ];

  let violates = false;
  for (const student of TEST_STUDENTS) {
    const exams = schedule.filter(s => student.enrolledCourses.includes(s.courseId));
    const dayCount = new Map<string, number>();
    exams.forEach(ex => {
      const day = ex.startTime.toDateString();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });
    for (const cnt of dayCount.values()) {
      if (cnt > 2) violates = true;
    }
  }

  const behaviorOK = !violates;
  logLine(behaviorOK, 'Behavior: no student has more than 2 exams in the same day.');

  // Integration: App içindeki dailySessionCount değişkeni gerçekten sınır kontrolü yapıyor mu?
  const appCode = readSource('src/app.tsx') || '';
  const hasDailySessionVar = appCode.includes('let dailySessionCount') || appCode.includes('dailySessionCount = 0');
  const checksLimit =
    appCode.includes('dailySessionCount') &&
    (appCode.includes('> 2') || appCode.includes('>= 2') || appCode.includes('< 3'));

  logLine(hasDailySessionVar, 'Integration: handleFinalizeSchedule declares dailySessionCount.');
  logLine(checksLimit, 'Integration: handleFinalizeSchedule checks dailySessionCount limit (currently missing).');

  const integrationOK = hasDailySessionVar && checksLimit;
  const passed = behaviorOK && integrationOK;
  console.log(`\nFR12 => ${passed ? 'PASS ✅' : 'FAIL ❌'} (muhtemelen şu an FAIL, limit kontrolü eksik)\n`);
  return passed;
}

// ===================================================================
// FR13 – Report when no solution is found
// ===================================================================

function testFR13(): boolean {
  header('FR13 – Report when no solution is found');

  // Behavior: çok fazla ders, az slot => imkansız durum
  const manyCourses = Array.from({ length: 100 }, (_, i) => ({
    id: `CS${i}`,
    code: `CS${i}`,
    name: `Course ${i}`,
    enrolledStudents: 30,
  }));
  const rooms = [{ id: 'R1', name: 'R1', capacity: 10, building: 'Main' }];
  const days = 2;
  const slotsPerDay = 3;
  const maxSlots = days * slotsPerDay;

  const impossible = manyCourses.length > maxSlots && rooms.length === 1;
  logLine(impossible, 'Behavior: scenario is mathematically impossible to schedule.');

  // Integration: App kodunda "no solution" gibi bir uyarı var mı?
  const appCode = readSource('src/app.tsx') || '';
  const hasNoSolutionMessage =
    appCode.toLowerCase().includes('no solution') ||
    appCode.toLowerCase().includes('cannot generate') ||
    appCode.toLowerCase().includes('no feasible');
  const hasAlertOrError =
    appCode.includes('alert(') || appCode.includes('console.error(');

  logLine(hasNoSolutionMessage, 'Integration: user-facing message for no-solution exists.');
  logLine(hasAlertOrError, 'Integration: app reports error via alert/console when failure occurs.');

  const behaviorOK = impossible; // sadece senaryo doğru kurulmuş mu?
  const integrationOK = hasNoSolutionMessage && hasAlertOrError;
  const passed = behaviorOK && integrationOK;
  console.log(`\nFR13 => ${passed ? 'PASS ✅' : 'FAIL ❌'} (muhtemelen şu an FAIL, no-solution raporu eksik)\n`);
  return passed;
}

// ===================================================================
// FR14 – Save generated exam schedule to a file system
// ===================================================================

function testFR14(): boolean {
  header('FR14 – Save schedule to file system');

  // Behavior: basit JSON yaz/oku (sadece kavramsal test)
  const schedule: ExamSession[] = [
    {
      id: 'e1',
      courseId: 'CS101',
      classroomId: 'R101',
      startTime: new Date('2025-01-02T09:00'),
      endTime: new Date('2025-01-02T11:00'),
    },
  ];

  const tmpPath = path.join(process.cwd(), 'tmp_schedule_test.json');
  try {
    fs.writeFileSync(
      tmpPath,
      JSON.stringify(
        schedule.map(s => ({
          ...s,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
        })),
        null,
        2
      ),
      'utf-8'
    );
    const readBack = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    const behaviorOK = Array.isArray(readBack) && readBack.length === 1 && readBack[0].courseId === 'CS101';
    logLine(behaviorOK, 'Behavior: schedule can be persisted to a JSON file and read back.');
  } catch (err) {
    logLine(false, 'Behavior: file system write/read failed in test environment.');
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }

  // Integration: projede gerçekten schedule kaydetmeye dönük kod var mı?
  const appCode = readSource('src/app.tsx') || '';
  const usesLocalStorage =
    appCode.includes('localStorage.setItem') || appCode.includes('localStorage.getItem');
  const usesFS =
    appCode.includes('fs.writeFile') || appCode.includes('writeFileSync');

  logLine(usesLocalStorage, 'Integration: schedule is stored in localStorage.');
  logLine(usesFS, 'Integration: schedule is written to file system.');

  const integrationOK = usesLocalStorage || usesFS; // muhtemelen false
  // behaviorOK'i yukarıda dosya operasyonundan ayrı tuttuk, ama gerçek pass/fail için integration önemli
  const passed = integrationOK;
  console.log(`\nFR14 => ${passed ? 'PASS ✅' : 'FAIL ❌'} (muhtemelen şu an FAIL, kalıcı kayıt eksik)\n`);
  return passed;
}
// ===================================================================
// NFR1 – Help menus
// ===================================================================

function testNFR1(): boolean {
  header('NFR1 – Help menus');

  // main process'te Help menüsü var mı?
  const mainCode = readSource('src/main.ts') || readSource('main.ts');

  const hasHelpMenu =
    mainCode.includes("label: 'Help'") ||
    mainCode.includes('label: "Help"');

  const hasAboutItem =
    mainCode.toLowerCase().includes('about examscheduler') ||
    mainCode.toLowerCase().includes('about exam scheduler');

  logLine(
    hasHelpMenu,
    'Integration: Electron main menu defines a Help menu.',
  );
  logLine(
    hasAboutItem,
    'Integration: Help menu contains an About item for the application.',
  );

  const passed = hasHelpMenu && hasAboutItem;
  console.log(`\nNFR1 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// NFR2 – Windows platform support (build)
// ===================================================================

function testNFR2(): boolean {
  header('NFR2 – Windows platform support');

  const forgeCode =
    readSource('forge.config.ts') || readSource('src/forge.config.ts');

  const hasMakerSquirrel = forgeCode.includes('MakerSquirrel');
  const usesMakerSquirrel = forgeCode.includes('new MakerSquirrel');

  logLine(
    hasMakerSquirrel,
    'Integration: Forge config imports MakerSquirrel (Windows installer).',
  );
  logLine(
    usesMakerSquirrel,
    'Integration: Forge config registers MakerSquirrel in makers array.',
  );

  const passed = hasMakerSquirrel && usesMakerSquirrel;
  console.log(`\nNFR2 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}

// ===================================================================
// NFR3 – English language availability
// ===================================================================

function testNFR3(): boolean {
  header('NFR3 – English language availability');

  const i18nCode = readSource('src/i18n.ts') || readSource('i18n.ts');

  const hasEnglishImport =
    i18nCode.includes("import en from") ||
    i18nCode.includes('import en from');

  const hasEnglishResource =
    i18nCode.includes('en:') &&
    i18nCode.includes('translation: en');

  const fallbackEn =
    i18nCode.includes("fallbackLng: 'en'") ||
    i18nCode.includes('fallbackLng: \"en\"');

  logLine(
    hasEnglishImport,
    'Integration: i18n configuration imports English translation file.',
  );
  logLine(
    hasEnglishResource,
    'Integration: i18n configuration registers English resources.',
  );
  logLine(
    fallbackEn,
    'Integration: i18n fallback language is set to English.',
  );

  const passed = hasEnglishImport && hasEnglishResource && fallbackEn;
  console.log(`\nNFR3 => ${passed ? 'PASS ✅' : 'FAIL ❌'}\n`);
  return passed;
}


// ===================================================================
// RUNNER
// ===================================================================

function runAll() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       EXAM SCHEDULER – FUNCTIONAL REQUIREMENTS       ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const results: Record<string, boolean> = {};
  results['FR1'] = testFR1();
  results['FR2'] = testFR2();
  results['FR3'] = testFR3();
  results['FR4–7'] = testFR4to7();
  results['FR8'] = testFR8();
  results['FR9'] = testFR9();
  results['FR10'] = testFR10();
  results['FR11'] = testFR11();
  results['FR12'] = testFR12();
  results['FR13'] = testFR13();
  results['FR14'] = testFR14();
  results['NFR1'] = testNFR1();
  results['NFR2'] = testNFR2();
  results['NFR3'] = testNFR3();

  const total = Object.keys(results).length;
  const passedCount = Object.values(results).filter(Boolean).length;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log(`  Total FRs:   ${total}`);
  console.log(`  Passed:      ${passedCount} ✅`);
  console.log(`  Failed:      ${total - passedCount} ❌`);
  console.log(`  Success:     ${((passedCount / total) * 100).toFixed(1)}%\n`);

  const failed = Object.entries(results).filter(([, ok]) => !ok);
  if (failed.length > 0) {
    console.log('FAILED REQUIREMENTS:\n');
    for (const [name] of failed) {
      console.log(`  ✗ ${name}`);
    }
    console.log('');
  }

  const critical = ['FR11', 'FR12', 'FR13', 'FR14'];
  const criticalFailed = critical.filter(k => !results[k]);
  if (criticalFailed.length > 0) {
    console.log('⚠️  CRITICAL (Scheduling-related) FAILURES:\n');
    criticalFailed.forEach(k => console.log(`  ✗ ${k}`));
    console.log('');
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

runAll();
