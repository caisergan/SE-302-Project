# Project Roadmap

This document outlines the development roadmap for the SchedulR application, based on the Student Affairs requirements and current project status.

## 🏁 Phase 1: Foundation & Data Management (Completed)
**Status:** ✅ Done

The core infrastructure and data entry capabilities are in place.
- [x] **Project Initialization**: Electron + React + TypeScript setup.
- [x] **Data Models**: Defined interfaces for `Course`, `Student`, `Classroom`.
- [x] **Data Import**:
    - [x] Parse Course files (with student enrollment).
    - [x] Parse Classroom files (with capacity).
- [x] **Data Management UI**:
    - [x] View imported data tables.
    - [x] Edit/Update data capability (via re-import or manual edit).
- [x] **Basic Navigation**: Sidebar and routing between views.

## 🚧 Phase 2: Visualization & UI Structure (Completed)
**Status:** ✅ Done

The UI structure is complete with all views implemented and connected.
- [x] **Dashboard UI**: Shows statistics and "Generate Schedule" button.
- [x] **ConstraintSelector**: Modal for configuring schedule parameters (dates, times, weekends).
- [x] **Schedule Generation**: Basic greedy algorithm implemented in `app.tsx`.
- [x] **Schedule Views**:
    - [x] **By Classroom**: View displays assigned exams per room.
    - [x] **By Student**: View displays individual student schedules.
    - [x] **By Course**: View displays exam time/location per course.
    - [x] **By Day**: View displays daily exam overview.

> **Note**: Views are fully functional but the underlying scheduler uses a simple round-robin algorithm without constraint enforcement.

## ✅ Phase 3: Core Scheduling Logic (Complete)
**Status:** ✅ Done

The scheduling engine is now fully implemented with constraint satisfaction.
- [x] **Algorithm Implementation**:
    - [x] Implemented `schedulerService.ts` with Backtracking/CSP algorithm.
    - [x] Implemented `isSafe` checks for all constraints.
- [x] **Mandatory Constraints**:
    - [x] **No Consecutive Exams**: Ensures a student doesn't have exams in slot `t` and `t+1`.
    - [x] **Max 2 Exams/Day**: Ensures a student has max 2 exams per day.
    - [x] **Room Capacity**: Ensures `enrolled < capacity`.
    - [x] **Room Availability**: Ensures 1 exam per room per slot.
- [x] **No Solution Handling**:
    - [x] Detects when no valid schedule exists.
    - [x] Reports "No Solution Found" to the user with error UI.
- [x] **Integration**:
    - [x] Connected `schedulerService` to `app.tsx` via IPC.
    - [x] Added loading spinner and error display in Dashboard.

## ✅ Phase 4: Persistence & Export (Complete)
**Status:** ✅ Done

Schedule persistence and export functionality implemented.
- [x] **Data Persistence**:
    - [x] Save generated schedule to SQLite database (auto-save after generation).
    - [x] Database schema includes `exam_sessions` table.
- [x] **Export**:
    - [x] Export schedule to CSV via file save dialog.

## ✅ Phase 5: Polish & Extras (Complete)
**Status:** ✅ Done

- [x] **Help Menus**: Documentation modal with Overview, Import, Generate, Views, and Export sections.
- [x] **Heuristics/Optimization**:
    - [x] Sort courses by difficulty/enrollment before scheduling (Degree Heuristic).
    - [x] Room capacity validation in constraint checking.
