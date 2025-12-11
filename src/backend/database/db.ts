import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const isDev = !app.isPackaged;
const dbPath = isDev
  ? path.join(__dirname, '../../schedulr.db') // In dev, store in project root
  : path.join(app.getPath('userData'), 'schedulr.db'); // In prod, store in userData for now

const db = new Database(dbPath, { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    enrolled_students INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    building TEXT
  );
  
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    course_code TEXT NOT NULL,
    classroom_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

