# SchedulR - SE-302 Project

SchedulR is a desktop application designed for Student Affairs authorities to automate and streamline the exam scheduling process. It allows for the management of courses, classrooms, and students, and generates conflict-free exam schedules based on strict academic constraints.

## Features

### 📅 Schedule Management

- **Automated Generation**: Generates valid exam schedules based on available resources and constraints.
- **Multiple Views**:
  - **By Classroom**: View utilization and assigned exams for each room.
  - **By Student**: Check individual exam schedules to ensure fairness.
  - **By Course**: Confirm final exam times and locations.
  - **By Day**: Daily overview of all scheduled exams.
- **Conflict Detection**: Reports when no valid solution can be found within the given constraints.

### 🎓 Resource Management

- **Data Import**: Import data via files (Excel/CSV) for:
  - **Courses**: Including registered student lists.
  - **Classrooms**: Including capacity information.
  - **Attendances**: Including student attendance information.
- **Data Management**: Edit, update, and re-import data as requirements change.

### 🛡️ Constraints & Logic

The system strictly enforces the following rules to ensure student well-being:

- **No Consecutive Exams**: A student cannot have two exams in consecutive time slots.
- **Max Daily Exams**: A student cannot be assigned more than two exams in a single day.

### 🌍 Internationalization

- Full support for **English** (default) and **Turkish**.

### 💾 Data Handling

- **Persistence**: Saves generated schedules and input data locally (SQLite) to avoid re-entry.
- **Export**: Export finalized schedules to documents (CSV/Excel) for distribution.
- **Modern UI**: Sleek, responsive design powered by TailwindCSS.

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
