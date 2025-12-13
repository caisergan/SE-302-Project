import { dialog } from 'electron';
import fs from 'fs';

interface ExportData {
    sessions: any[];
    courses: any[];
    classrooms: any[];
}

export const exportScheduleToCSV = async (data: ExportData) => {
    try {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Export Schedule',
            defaultPath: 'exam_schedule.csv',
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!filePath) return { success: false, message: 'Export cancelled' };

        const headers = ["Course Code", "Course Name", "Classroom", "Student Count", "Date", "Start Time", "End Time"];
        const rows = [];

        for (const session of data.sessions) {
            const cId = session.courseId || session.courseCode;
            const rId = session.classroomId || session.classroomName;

            const course = data.courses.find((c: any) => String(c.id) === String(cId)); 
            const room = data.classrooms.find((r: any) => String(r.id) === String(rId));
            
            const dateObj = new Date(session.startTime);
            const dateStr = dateObj.toLocaleDateString();
            const startStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // ÖĞRENCİ SAYISI (KESİN ÇÖZÜM)
            // Scheduler'dan gelen veriyi kullanıyoruz.
            // Eğer session.studentCount undefined geliyorsa, interface veya taşıma sorunu vardır.
            const studentCount = session.studentCount !== undefined ? session.studentCount : (course?.enrolledStudents || 0);

            const row = [
                course?.code || cId,
                course?.name || "Unknown",
                room?.name || rId,
                studentCount, // 👈 Burası artık dolu gelecek
                dateStr,
                startStr,
                endStr
            ].map(field => `"${field}"`).join(";"); 

            rows.push(row);
        }

        const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n"); 
        fs.writeFileSync(filePath, csvContent, 'utf-8');

        return { success: true, message: 'Schedule exported successfully!' };

    } catch (error) {
        console.error("Export Error:", error);
        return { success: false, message: `Export failed: ${error}` };
    }
};