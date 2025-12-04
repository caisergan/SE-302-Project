# Sprint Plan (split.md)

This document breaks down the remaining work into manageable sprints based on the SRS requirements and current project status.

---

## Sprint Overview

| Sprint | Focus Area | Duration (Est.) | Priority |
|--------|-----------|-----------------|----------|
| Sprint 1 | Testing Infrastructure | 1 week | High |
| Sprint 2 | Core Scheduling Algorithm | 2-3 weeks | Critical |
| Sprint 3 | Constraint Enforcement | 1-2 weeks | Critical |
| Sprint 4 | Data Persistence | 1 week | Medium |
| Sprint 5 | Export & Polish | 1 week | Medium |

---

## Sprint 1: Testing Infrastructure 🧪
**Goal**: Finalize automated testing framework and ensure all tests pass  
**Status**: ✅ Mostly Complete (Extensive test suite exists)

### ✅ Completed
- [x] Jest + ts-jest + @testing-library/react configured
- [x] `jest.config.cjs` configured  
- [x] `setupTests.ts` created
- [x] Comprehensive test suite in `tests/tests.tsx` (872 lines!) covering:
  - [x] FR1: Data import parsing (courses, classrooms, students)
  - [x] FR2: Data management (add, edit, clear)
  - [x] FR3: Schedule generation trigger
  - [x] FR4-7: All schedule views (classroom, student, course, day)
  - [x] FR8: Export button exists
  - [x] FR11-12: Constraint validation functions (logic exists in tests)
  - [x] FR13: No solution detection
  - [x] NF3: Language support

### Remaining Tasks
- [ ] Run `npm test` and verify all tests pass
- [ ] Fix any failing tests
- [ ] Add test coverage reporting to `package.json`
- [ ] Document test results in `specs/test_design.md`

### Deliverables
- All tests passing
- Test coverage report
- Updated `test_design.md`

### SRS Requirements Addressed
- Foundation for validation of ALL functional requirements

---

## Sprint 2: Core Scheduling Algorithm 🧠
**Goal**: Implement constraint-aware scheduling engine  
**Status**: 🔴 Not Started

### Tasks
- [ ] Create `src/utils/scheduler.ts`
- [ ] Implement `Scheduler` class with:
  - [ ] Data preprocessing (student-course mappings)
  - [ ] Backtracking algorithm structure
  - [ ] Slot assignment logic
- [ ] Design time slot representation
- [ ] Implement heuristics:
  - [ ] Sort courses by enrollment (descending)
  - [ ] Try smallest suitable rooms first
- [ ] Write unit tests for `Scheduler`
- [ ] Document algorithm in `specs/algorithm_design.md`

### Deliverables
- `Scheduler` class with basic assignment capability
- Algorithm documentation
- Passing tests for simple scheduling scenarios

### SRS Requirements Addressed
- [] FR 10: Generate valid exam schedule

---

## Sprint 3: Constraint Enforcement ✅
**Goal**: Enforce all mandatory student constraints  
**Status**: 🔴 Not Started

### Tasks
- [ ] Implement `isSafe()` constraint validation:
  - [ ] **No Consecutive Exams**: Check if student has exam at slot±1
  - [ ] **Max 2 Exams/Day**: Count student's exams per day
  - [ ] **Room Capacity**: Verify `enrolledStudents <= capacity`
  - [ ] **Room Availability**: Ensure room is free at time slot
- [ ] Implement "No Solution Found" detection
- [ ] Update UI to show error message when no solution exists
- [ ] Write comprehensive constraint tests:
  - [ ] Edge cases (1 room, many courses)
  - [ ] Impossible scenarios
- [ ] Integrate `Scheduler` into `app.tsx`
- [ ] Test with real-world data scenarios

### Deliverables
- Fully functional constraint-aware scheduler
- "No Solution" error handling
- Passing tests for all constraint scenarios

### SRS Requirements Addressed
- [X→] FR 3: Schedule generation (upgrade from mock to real)
- [X→] FR 4-7: Views (upgrade from mock data to real schedules)
- [] FR 10: Generate valid schedule
- [] FR 11: No consecutive exams constraint
- [] FR 12: Max 2 exams/day constraint
- [] FR 13: Report no solution

---

## Sprint 4: Data Persistence 💾
**Goal**: Save and load data locally  
**Status**: 🔴 Not Started

### Tasks
- [ ] Choose persistence method (JSON file vs SQLite)
- [ ] Implement save/load for:
  - [ ] Courses
  - [ ] Classrooms
  - [ ] Students
  - [ ] Generated schedules
- [ ] Add "Save" and "Load" buttons to UI
- [ ] Auto-save on schedule generation
- [ ] Auto-load on app startup (if data exists)
- [ ] Handle file system errors gracefully
- [ ] Document database schema in `specs/db_design.md`

### Deliverables
- Data persists between app sessions
- Save/Load UI controls
- Updated `db_design.md`

### SRS Requirements Addressed
- [] FR 14: Save schedule to file system

---

## Sprint 5: Export & Polish 🎨
**Goal**: Export functionality and user experience improvements  
**Status**: 🔴 Not Started

### Tasks
- [ ] Implement CSV export logic (button already exists in `ScheduleView.tsx` line 127-130):
  - [ ] Export by Classroom
  - [ ] Export by Student
  - [ ] Export by Course
  - [ ] Export by Day
- [ ] Connect export button onClick handler
- [ ] Implement Help Menu system:
  - [ ] User guide modal
  - [ ] Tooltips for key features
  - [ ] FAQ section
- [ ] Final UI polish:
  - [ ] Consistent styling
  - [ ] Loading states during generation
  - [ ] Success/Error notifications
- [ ] End-to-end testing
- [ ] Performance optimization (if needed)

### Deliverables
- Working CSV export
- Help documentation
- Polished UI
- Complete application ready for deployment

### SRS Requirements Addressed
- [] FR 8: Export to document
- [] NFR 1: Help menus

---

## Definition of Done

Each sprint is considered complete when:
- [ ] All tasks are implemented
- [ ] Tests are written and passing (where applicable)
- [ ] Documentation is updated
- [ ] Code is reviewed and refactored
- [ ] Feature is demonstrated working end-to-end

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scheduling algorithm too slow for large datasets | High | Implement timeout, suggest reducing constraints |
| No solution found for valid inputs | Medium | Add constraint relaxation suggestions to user |
| Data persistence compatibility issues | Low | Use widely-supported JSON format |
| Export formatting issues | Low | Test with various data sizes |

---

## Current Status Summary

### ✅ Completed
- Data import/management
- UI structure and navigation
- Basic (greedy) schedule generation
- All view components
- **Comprehensive test suite (872 lines covering all FR requirements)**
- **Jest configuration and testing infrastructure**

### 🟡 In Progress
- Running and validating existing tests
- Documenting test results

### 🔴 Not Started
- Constraint-aware scheduling algorithm (tests exist, implementation needed)
- Data persistence
- Export functionality (button exists, logic needed)
- Help menus
