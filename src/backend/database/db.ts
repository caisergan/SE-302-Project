import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// Veritabanı dosyasının yolu
const dbPath = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), 'schedulr.db')
  : path.join(app.getPath('userData'), 'schedulr.db');

const dbFolder = path.dirname(dbPath);
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

const initDb = () => {
  // COURSES
  db.exec(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      enrolled_students INTEGER DEFAULT 0
  )`);

  // CLASSROOMS
  db.exec(`CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      building TEXT
  )`);

  // STUDENTS (Email sütunu eklendi!)
  db.exec(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT
  )`);

  // ENROLLMENTS
  db.exec(`CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(course_id, student_id)
  )`);
};

initDb();
export default db;