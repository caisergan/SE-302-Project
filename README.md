# SchedulR - SE-302 Project

SchedulR is a desktop application designed for Student Affairs authorities to automate and streamline the exam scheduling process. It allows for the management of courses, classrooms, and students, and generates conflict-free exam schedules based on strict academic constraints.

## Features

### 📅 Schedule Management

- **Schedule Generation**: Generates exam schedules with configurable date ranges and time slots.
- **Multiple Views**:
  - **By Classroom**: View utilization and assigned exams for each room.
  - **By Student**: Check individual exam schedules.
  - **By Course**: Confirm final exam times and locations.
  - **By Day**: Daily overview of all scheduled exams.
- **Configurable Parameters**:
  - Start/End dates
  - Weekend inclusion
  - Daily time ranges

> **Note**: Current implementation uses a simple greedy algorithm. Constraint enforcement (no consecutive exams, max 2 exams/day) is not yet implemented.

### 🎓 Resource Management

- **Data Import**: Import data via files (CSV/Text) for:
  - **Courses**: Including course codes and student counts.
  - **Classrooms**: Including capacity information.
  - **Students**: Including enrollment data.
- **Data Management**: Edit, update, and re-import data as requirements change.
- **Manual Entry**: Add/edit courses and classrooms individually.

### 🛡️ Constraints & Logic (Planned)

The following constraints are specified in requirements but not yet enforced:

- **No Consecutive Exams**: A student should not have two exams in consecutive time slots.
- **Max Daily Exams**: A student should not be assigned more than two exams in a single day.
- **Room Capacity**: Exams should only be assigned to rooms with sufficient capacity.

### 🌍 Internationalization

- Full support for **English** (default) and **Turkish**.

### 💾 Data Handling

- **In-Memory State**: Currently uses React state (data is lost on app close).
- **Export**: Not yet implemented.

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Internationalization**: [i18next](https://www.i18next.com/)

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/caisergan/SE-302-Project.git
    cd SE-302-Project
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

### Running the App

To start the application in development mode:

```bash
npm start
```

This command will start the Electron app with hot-reloading enabled.

### Building for Production

To create a distributable package for your OS:

```bash
npm run make
```

## Project Structure

- `src/`: Source code for the application.
  - `components/`: React components.
  - `locales/`: Translation files (en, tr).

## License

MIT
