# Code Reference

## Project Structure

```
SE-302-Project/
├── src/
│   ├── components/         # React UI Components
│   │   ├── Dashboard.tsx   # Main dashboard view
│   │   ├── DataInput.tsx   # Data import and management view
│   │   ├── ScheduleView.tsx# Schedule visualization
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── Settings.tsx    # App settings
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces (Course, Student, etc.)
│   ├── utils/
│   │   └── scheduler.ts    # Scheduling Algorithm Implementation
│   ├── app.tsx             # Main App component & Routing logic
│   ├── main.ts             # Electron Main Process entry point
│   └── renderer.tsx        # React DOM entry point
├── specs/                  # Design Specifications
│   ├── srs.md
│   ├── architecture.md
│   ├── db_design.md
│   ├── algorithm_design.md
│   └── test_design.md
├── docs/
│   └── code_reference.md   # This file
└── package.json
```

## Key Modules

### `src/utils/scheduler.ts`
Contains the `Scheduler` class.
- `generateSchedule()`: Main entry point.
- `backtrack()`: Recursive solver.
- `isSafe()`: Constraint validation logic.

### `src/components/DataInput.tsx`
Handles file parsing and data entry.
- `processCSV()`: Parses uploaded files.
- `parseStudentAttendanceFile()`: Handles the specific student-course mapping format.

### `src/types/index.ts`
Defines the core data models.
- `Course`: `{ id, code, name, enrolledStudents }`
- `Student`: `{ id, name, enrolledCourses[] }`
- `ExamSession`: `{ id, courseId, classroomId, startTime, endTime }`

## Build & Run
- **Dev**: `npm start`
- **Build**: `npm run make`
