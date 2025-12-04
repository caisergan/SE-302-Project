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
`);

export default db;
