import db from '../database/db';

export interface ClassroomDB {
    id: number;
    name: string;
    capacity: number;
    building: string;
}

export const getClassrooms = (): ClassroomDB[] => {
    return db.prepare('SELECT * FROM classrooms').all() as ClassroomDB[];
};

export const addClassroomsBulk = (classrooms: { name: string; capacity: number; building: string }[]): void => {
    const insert = db.prepare('INSERT INTO classrooms (name, capacity, building) VALUES (@name, @capacity, @building)');
    const insertMany = db.transaction((rooms) => {
        for (const room of rooms) insert.run(room);
    });
    insertMany(classrooms);
};

export const updateClassroom = (id: number, name: string, capacity: number, building: string): void => {
    const stmt = db.prepare('UPDATE classrooms SET name = ?, capacity = ?, building = ? WHERE id = ?');
    stmt.run(name, capacity, building, id);
};

export const deleteClassroom = (id: number): void => {
    db.prepare('DELETE FROM classrooms WHERE id = ?').run(id);
};

export const clearClassrooms = (): void => {
    db.prepare('DELETE FROM classrooms').run();
};