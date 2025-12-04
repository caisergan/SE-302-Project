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

## 🛠 Phase 3: Core Scheduling Logic (Next Steps)
**Status:** 🔴 Not Started

This is the critical "brain" of the application that needs to be implemented next.
- [ ] **Algorithm Implementation**:
    - [ ] Re-implement `Scheduler` class with Backtracking/CSP algorithm.
    - [ ] Implement `isSafe` checks for constraints.
- [ ] **Mandatory Constraints**:
    - [ ] **No Consecutive Exams**: Ensure a student doesn't have exams in slot `t` and `t+1`.
    - [ ] **Max 2 Exams/Day**: Ensure a student has max 2 exams per day.
    - [ ] **Room Capacity**: Ensure `enrolled < capacity`.
    - [ ] **Room Availability**: Ensure 1 exam per room per slot.
- [ ] **No Solution Handling**:
    - [ ] Detect when no valid schedule exists.
    - [ ] Report "No Solution Found" to the user.
- [ ] **Integration**:
    - [ ] Connect `Scheduler` output to the Global State (`app.tsx`).

## 💾 Phase 4: Persistence & Export
**Status:** 🔴 Not Started

Features required for a usable desktop application.
- [ ] **Data Persistence**:
    - [ ] Save imported data and generated schedule to local file (JSON/SQLite).
    - [ ] Load data on application startup.
- [ ] **Export**:
    - [ ] Export schedule to CSV/Excel.

## 🎨 Phase 5: Polish & Extras
**Status:** 🔴 Not Started

- [ ] **Help Menus**: Documentation for Student Affairs users.
- [ ] **Heuristics/Optimization**:
    - [ ] Sort courses by difficulty/enrollment before scheduling.
    - [ ] Balance classroom usage.
