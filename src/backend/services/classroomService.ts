import db from '../database/db';

export interface ClassroomDB {
    id: number;
    name: string;
    capacity: number;
    building: string;
}

export const getClassrooms = (): ClassroomDB[] => {
    const stmt = db.prepare('SELECT * FROM classrooms');
    return stmt.all() as ClassroomDB[];
};

export const addClassroomsBulk = (classrooms: { name: string; capacity: number; building: string }[]): void => {
    const insert = db.prepare('INSERT INTO classrooms (name, capacity, building) VALUES (@name, @capacity, @building)');
    const insertMany = db.transaction((classrooms) => {
        for (const classroom of classrooms) insert.run(classroom);
    });
    insertMany(classrooms);
};

export const clearClassrooms = (): void => {
    db.prepare('DELETE FROM classrooms').run();
};
