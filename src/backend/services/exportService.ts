import { dialog } from 'electron';
import fs from 'fs';

interface ExportData {
    sessions: any[];
    courses: any[];
    classrooms: any[];
}

export const exportScheduleToCSV = async (data: ExportData) => {
    try {
        // 1. Kullanıcıya "Nereye Kaydedeyim?" diye sor
        const { filePath } = await dialog.showSaveDialog({
            title: 'Export Schedule',
            defaultPath: 'exam_schedule.csv',
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!filePath) return { success: false, message: 'Export cancelled' };

        // 2. CSV Başlıkları
        const headers = ["Session ID", "Course Code", "Course Name", "Classroom", "Date", "Start Time", "End Time"];
        const rows = [];

        // 3. Veriyi İşle
        for (const session of data.sessions) {
            // Frontend'den gelen ID'leri isimlerle eşleştir
            const course = data.courses.find((c: any) => String(c.id) === String(session.courseCode)); 
            const room = data.classrooms.find((r: any) => String(r.id) === String(session.classroomName));
            
            // Tarih formatlama
            const dateObj = new Date(session.startTime);
            const dateStr = dateObj.toLocaleDateString();
            const startStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Satırı oluştur (CSV'de virgül sorunu olmasın diye tırnak içine alıyoruz)
            const row = [
                session.sessionId,
                course?.code || session.courseCode,
                course?.name || "Unknown",
                room?.name || session.classroomName,
                dateStr,
                startStr,
                endStr
            ].map(field => `"${field}"`).join(","); // Her alanı tırnak içine al ve virgülle birleştir

            rows.push(row);
        }

        // 4. Dosyayı Yaz
        const csvContent = [headers.join(","), ...rows].join("\n");
        fs.writeFileSync(filePath, csvContent, 'utf-8');

        return { success: true, message: 'Schedule exported successfully!' };

    } catch (error) {
        console.error("Export Error:", error);
        return { success: false, message: `Export failed: ${error}` };
    }
};