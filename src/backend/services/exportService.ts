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
            // ID eşleşmesi (Hem Id hem Code kontrolü)
            const cId = session.courseId || session.courseCode;
            const rId = session.classroomId || session.classroomName;

            const course = data.courses.find((c: any) => String(c.id) === String(cId)); 
            const room = data.classrooms.find((r: any) => String(r.id) === String(rId));
            
            const dateObj = new Date(session.startTime);
            const dateStr = dateObj.toLocaleDateString();
            const startStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // ÖĞRENCİ SAYISI (KESİN ÇÖZÜM)
            // Önce Scheduler'ın hesaplayıp session'a gömdüğü veriye bakıyoruz.
            // Bulamazsa course nesnesine bakıyoruz.
            let count = session.studentCount;
            
            if (!count && course) {
                if (typeof course.enrolledStudents === 'number') count = course.enrolledStudents;
                else if (Array.isArray(course.students)) count = course.students.length;
                else if (Array.isArray(course.enrolled_students)) count = course.enrolled_students.length;
            }

            const row = [
                course?.code || cId,
                course?.name || "Unknown",
                room?.name || rId,
                count || 0, // Sayı yoksa 0 yaz
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