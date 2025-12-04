# Code Reference

## Project Structure

```
SE-302-Project/
├── src/
│   ├── components/         # React UI Components
│   │   ├── ConstraintSelector.tsx  # Schedule configuration modal
│   │   ├── Dashboard.tsx           # Main dashboard view
│   │   ├── DataInput.tsx           # Data import and management view
│   │   ├── ScheduleView.tsx        # Schedule visualization
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   └── Settings.tsx            # App settings
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── constants/
│   │   └── index.ts        # Mock data constants
│   ├── locales/
│   │   ├── en.json         # English translations
│   │   └── tr.json         # Turkish translations
│   ├── app.tsx             # Main App component & state management
│   ├── main.ts             # Electron Main Process entry point
│   ├── renderer.tsx        # React DOM entry point
│   └── i18n.ts             # i18next configuration
├── specs/                  # Design Specifications
│   ├── srs.md
│   ├── architecture.md
│   ├── db_design.md
│   ├── algorithm_design.md
│   └── test_design.md
├── docs/
│   └── code_reference.md   # This file
├── roadmap.md
└── package.json
```

## Key Modules

### `src/app.tsx`
Main application component.
- **State Management**: Manages global state for courses, classrooms, students, schedule
- **Routing**: Handles view switching (Dashboard, Data, Schedule, Settings)
- **Schedule Generation**: `handleFinalizeSchedule()` - Creates schedule based on constraints

### `src/components/DataInput.tsx`
Handles file parsing and data entry.
- `parseCourseListFile()`: Parses course CSV files
- `parseClassroomFile()`: Parses classroom data
- `parseStudentAttendanceFile()`: Parses student enrollment data

### `src/components/ConstraintSelector.tsx`
Modal component for schedule configuration.
- Allows user to set:
  - Start/End dates
  - Weekend inclusion
  - Daily start/end times

### `src/components/ScheduleView.tsx`
Displays the generated schedule in multiple formats:
- By Classroom
- By Student
- By Course
- By Day

### `src/types/index.ts`
Defines the core data models:
- `ViewMode`: Enum for view states
- `GenerationConstraints`: Schedule configuration parameters
- `Course`: `{ id, code, name, enrolledStudents }`
- `Student`: `{ id, name, email, enrolledCourses[] }`
- `Classroom`: `{ id, name, capacity, building }`
- `ExamSession`: `{ id, courseId, classroomId, startTime, endTime }`

### `src/constants/index.ts`
Mock data for development and testing.

### `src/i18n.ts`
i18next configuration for internationalization (English/Turkish support).

## Build & Run

- **Development**: `npm start`
- **Build**: `npm run make`
- **Package**: Creates distributable Electron app for current platform

## Current Limitations

- **No Constraint Enforcement**: The schedule generator does not enforce:
  - No consecutive exams for students
  - Max 2 exams per day per student
  - Room capacity constraints
- **No Persistence**: Data is lost on application restart
- **No Export**: Cannot export schedule to CSV/Excel (yet)
