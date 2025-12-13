import { Course, Classroom, ExamSession, GenerationConstraints } from '../../types';
import { StudentWithCourses } from '../services/studentService';

interface SchedulerInput {
    courses: Course[];
    classrooms: Classroom[];
    students: StudentWithCourses[];
    constraints: GenerationConstraints;
}

export const generateSchedule = (input: SchedulerInput): ExamSession[] => {
    console.log("🔒 Strict (Sıfır Çakışma) Algoritması Çalışıyor...");
    const { courses, classrooms, students, constraints } = input;
    const schedule: ExamSession[] = [];

    // 1. ZAMAN DİLİMLERİ
    const timeSlots = generateTimeSlots(constraints);
    if (timeSlots.length === 0) throw new Error("Uygun saat yok. Tarih aralığını genişletin.");

    // 2. VERİ YAPILARI (Hızlı Erişim)
    const courseStudents = new Map<string, Set<string>>();
    students.forEach(s => {
        const sId = String((s as any).studentNumber || s.id);
        s.enrolled_courses.forEach(c => {
            const code = c.trim();
            if (!courseStudents.has(code)) courseStudents.set(code, new Set());
            courseStudents.get(code)!.add(sId);
        });
    });

    // 3. DERSLERİ SIRALA (En kalabalık dersi en önce yerleştir - Zorluk Derecesine Göre)
    let remainingCourses = [...courses]
        .filter(c => c.enrolledStudents > 0)
        .sort((a, b) => b.enrolledStudents - a.enrolledStudents);

    // Takipçiler
    const studentBusySlots = new Map<string, Set<number>>();
    const studentDailyCounts = new Map<string, Map<string, number>>();
    
    // ODA KULLANIM SAYACI (Dengeli Dağıtım İçin)
    const roomUsageCounts = new Map<string, number>();
    classrooms.forEach(r => roomUsageCounts.set(r.id.toString(), 0));

    // 4. ANA DÖNGÜ (Zaman Öncelikli)
    for (let tIndex = 0; tIndex < timeSlots.length; tIndex++) {
        if (remainingCourses.length === 0) break;
        const slot = timeSlots[tIndex];
        const dateKey = slot.start.toDateString();

        // BU SLOTTA KULLANILABİLİR ODALAR
        // (Kullanım sayısına göre sıralı - Load Balancing)
        let availableRooms = [...classrooms].sort((a, b) => {
            const usageA = roomUsageCounts.get(a.id.toString()) || 0;
            const usageB = roomUsageCounts.get(b.id.toString()) || 0;
            if (usageA !== usageB) return usageA - usageB;
            return a.capacity - b.capacity;
        });

        // Bu slotta meşgul olan öğrenciler (Anlık Çakışma Kontrolü için)
        const studentsBusyInThisSlot = new Set<string>();
        
        const nextLoopCourses: Course[] = [];

        for (const course of remainingCourses) {
            // 1. ODA VAR MI?
            const roomIndex = availableRooms.findIndex(r => r.capacity >= course.enrolledStudents);
            if (roomIndex === -1) {
                nextLoopCourses.push(course); // Oda yetmedi, sonraya bırak
                continue;
            }

            // 2. ÇAKIŞMA KONTROLÜ (KESİN KURAL)
            const enrolledIds = courseStudents.get(course.code.trim());
            let isConflict = false;

            if (enrolledIds) {
                for (const sId of enrolledIds) {
                    // KURAL 1: Öğrenci şu an başka bir sınavda mı?
                    if (studentsBusyInThisSlot.has(sId)) { 
                        isConflict = true; 
                        break; 
                    }
                    
                    // KURAL 2: Öğrenci bir önceki saatte sınavda mıydı? (Ardışık Sınav Engelleyici)
                    // (İsteğe bağlı: Eğer ardışık sınava izin veriyorsanız bu if'i kaldırın)
                    if (studentBusySlots.get(sId)?.has(tIndex - 1)) { 
                        isConflict = true; 
                        break; 
                    }

                    // KURAL 3: Günlük Maksimum Sınav Limiti (Örn: Günde en fazla 2 sınav)
                    const dailyExams = studentDailyCounts.get(sId)?.get(dateKey) || 0;
                    if (dailyExams >= 2) { 
                        isConflict = true; 
                        break; 
                    }
                }
            }

            // Eğer tek bir öğrenci bile çakışıyorsa, bu dersi bu saate KOYMA.
            if (isConflict) {
                nextLoopCourses.push(course);
                continue;
            }

            // ✅ YERLEŞTİRME BAŞARILI
            const assignedRoom = availableRooms[roomIndex];
            schedule.push({
                id: crypto.randomUUID(),
                courseId: course.id.toString(),
                classroomId: assignedRoom.id.toString(),
                startTime: slot.start,
                endTime: slot.end
            });

            // Kaynakları Güncelle
            availableRooms.splice(roomIndex, 1); // Odayı listeden düş
            roomUsageCounts.set(assignedRoom.id.toString(), (roomUsageCounts.get(assignedRoom.id.toString()) || 0) + 1);

            // Öğrenci Durumlarını Güncelle
            if (enrolledIds) {
                for (const sId of enrolledIds) {
                    studentsBusyInThisSlot.add(sId); // Şu an meşgul
                    
                    if (!studentBusySlots.has(sId)) studentBusySlots.set(sId, new Set());
                    studentBusySlots.get(sId)!.add(tIndex); // Slot geçmişine ekle
                    
                    if (!studentDailyCounts.has(sId)) studentDailyCounts.set(sId, new Map());
                    const dMap = studentDailyCounts.get(sId)!;
                    dMap.set(dateKey, (dMap.get(dateKey) || 0) + 1); // Günlük sayacı artır
                }
            }
        }
        remainingCourses = nextLoopCourses;
    }

    if (remainingCourses.length > 0) {
        throw new Error(
            `Takvim oluşturulamadı! Aşağıdaki dersler için çakışmasız yer bulunamadı:\n` +
            `${remainingCourses.map(c => c.code).join(", ")}\n` +
            `Çözüm: Tarih aralığını uzatın veya öğrencilerin ders seçimlerini kontrol edin.`
        );
    }

    return schedule;
};

// Zaman Dilimi Oluşturucu
function generateTimeSlots(constraints: GenerationConstraints) {
    const slots = [];
    const current = new Date(constraints.startDate);
    const end = new Date(constraints.endDate);
    const [sH, sM] = constraints.dailyStartTime.split(':').map(Number);
    const [eH, eM] = constraints.dailyEndTime.split(':').map(Number);

    while (current <= end) {
        // Hafta sonu kontrolü
        if (!constraints.includeWeekends && (current.getDay() === 0 || current.getDay() === 6)) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        let start = new Date(current); 
        start.setHours(sH, sM, 0, 0);
        
        let dayLimit = new Date(current); 
        dayLimit.setHours(eH, eM, 0, 0);

        while (start < dayLimit) {
            let slotEnd = new Date(start); 
            slotEnd.setHours(start.getHours() + 2); // Sınav Süresi: 2 Saat

            if (slotEnd <= dayLimit) {
                slots.push({ start: new Date(start), end: new Date(slotEnd) });
            }
            // Bir sonraki sınav 2 saat + 15 dk sonra başlasın
            start.setMinutes(start.getMinutes() + 120 + 15); 
        }
        current.setDate(current.getDate() + 1);
    }
    return slots;
}