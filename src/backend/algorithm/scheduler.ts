import { Course, Classroom, ExamSession, GenerationConstraints } from '../../types';
import { StudentWithCourses } from '../services/studentService';

interface SchedulerInput {
    courses: Course[];
    classrooms: Classroom[];
    students: StudentWithCourses[];
    constraints: GenerationConstraints;
}

export const generateSchedule = (input: SchedulerInput): ExamSession[] => {
    console.log("🔒 Strict Rules: Max 2 Exam/Day + 2H Gap Enabled");
    const { courses, classrooms, students, constraints } = input;
    const schedule: ExamSession[] = [];

    // 1. ZAMAN DİLİMLERİ OLUŞTUR
    const timeSlots = generateTimeSlots(constraints);
    if (timeSlots.length === 0) throw new Error("Uygun saat yok. Tarih aralığını genişletin.");

    // 2. ÖĞRENCİ-DERS HARİTASI
    const courseStudents = new Map<string, Set<string>>();
    students.forEach(s => {
        const sId = String((s as any).studentNumber || s.id);
        s.enrolled_courses.forEach(c => {
            const code = c.trim();
            if (!courseStudents.has(code)) courseStudents.set(code, new Set());
            courseStudents.get(code)!.add(sId);
        });
    });

    // 3. DERSLERİ HAZIRLA
    let remainingCourses = [...courses].map(c => {
        const realCount = courseStudents.get(c.code.trim())?.size || 0;
        return { ...c, enrolledStudents: realCount };
    })
    .filter(c => c.enrolledStudents > 0)
    .sort((a, b) => b.enrolledStudents - a.enrolledStudents);

    // --- TAKİP MEKANİZMALARI ---
    const studentsBusyInThisSlot = new Set<string>(); // Anlık (O saatteki) meşguliyet
    
    // Öğrencinin günlük sınav sayısını tutar: Map<ÖğrenciID, Map<TarihString, Sayı>>
    const studentDailyCounts = new Map<string, Map<string, number>>();
    
    // Öğrencinin o gün girdiği SON sınavın BİTİŞ saatini tutar (2 saat kuralı için)
    // Map<ÖğrenciID, Map<TarihString, Date>>
    const studentLastExamEndTimes = new Map<string, Map<string, Date>>();

    const roomUsageCounts = new Map<string, number>();
    classrooms.forEach(r => roomUsageCounts.set(r.id.toString(), 0));

    // 4. ANA DÖNGÜ (Zaman Öncelikli)
    for (let tIndex = 0; tIndex < timeSlots.length; tIndex++) {
        if (remainingCourses.length === 0) break;
        
        const slot = timeSlots[tIndex];
        const dateKey = slot.start.toDateString(); // "Mon Dec 14 2025" gibi
        
        // Her slot başında anlık meşguliyeti temizle
        studentsBusyInThisSlot.clear();

        // Odaları sırala
        let availableRooms = [...classrooms].sort((a, b) => {
            const usageA = roomUsageCounts.get(a.id.toString()) || 0;
            const usageB = roomUsageCounts.get(b.id.toString()) || 0;
            if (usageA !== usageB) return usageA - usageB;
            return a.capacity - b.capacity;
        });

        const nextLoopCourses: Course[] = [];

        for (const course of remainingCourses) {
            // A. ODA KONTROLÜ
            const roomIndex = availableRooms.findIndex(r => r.capacity >= course.enrolledStudents);
            if (roomIndex === -1) {
                nextLoopCourses.push(course);
                continue;
            }

            // B. KATI KURAL KONTROLLERİ
            const enrolledIds = courseStudents.get(course.code.trim());
            let isConflict = false;

            if (enrolledIds) {
                for (const sId of enrolledIds) {
                    // KURAL 1: ANLIK ÇAKIŞMA
                    // Öğrenci şu an başka bir sınıfta sınavda mı?
                    // (Bu kontrolü aslında studentBusyInThisSlot setiyle yapmak yerine
                    // aşağıda işlenen sınavları takip ederek de yapabiliriz ama bu da güvenli)
                    // Not: Bir önceki döngüde bu slot'a yerleşenler 'studentsBusyInThisSlot' içine atılır.
                    if (studentsBusyInThisSlot.has(sId)) {
                        isConflict = true;
                        break;
                    }

                    // KURAL 2: GÜNLÜK MAX 2 SINAV
                    const dailyCount = studentDailyCounts.get(sId)?.get(dateKey) || 0;
                    if (dailyCount >= 2) {
                        isConflict = true;
                        break;
                    }

                    // KURAL 3: SINAVLAR ARASI EN AZ 2 SAAT (120 Dakika) ARA
                    const lastEndTime = studentLastExamEndTimes.get(sId)?.get(dateKey);
                    if (lastEndTime) {
                        const diffInMs = slot.start.getTime() - lastEndTime.getTime();
                        const diffInMinutes = diffInMs / (1000 * 60);
                        
                        // Eğer fark 120 dakikadan azsa (Örn: 15 dk ara varsa) ÇAKIŞMA VARDIR.
                        if (diffInMinutes < 120) {
                            isConflict = true;
                            break;
                        }
                    }
                }
            }

            if (isConflict) {
                nextLoopCourses.push(course); // Kurallara uymadı, sonraki tura/güne kalsın
                continue;
            }

            // C. YERLEŞTİRME (Her şey uygun)
            const assignedRoom = availableRooms[roomIndex];
            
            schedule.push({
                id: crypto.randomUUID(),
                courseId: course.id.toString(),
                classroomId: assignedRoom.id.toString(),
                startTime: slot.start,
                endTime: slot.end,
                studentCount: course.enrolledStudents
            });

            // Kaynakları Güncelle
            availableRooms.splice(roomIndex, 1);
            roomUsageCounts.set(assignedRoom.id.toString(), (roomUsageCounts.get(assignedRoom.id.toString()) || 0) + 1);

            if (enrolledIds) {
                for (const sId of enrolledIds) {
                    // 1. Bu slot için öğrenciyi kilitle
                    studentsBusyInThisSlot.add(sId);

                    // 2. Günlük sınav sayısını artır
                    if (!studentDailyCounts.has(sId)) studentDailyCounts.set(sId, new Map());
                    const dMap = studentDailyCounts.get(sId)!;
                    dMap.set(dateKey, (dMap.get(dateKey) || 0) + 1);

                    // 3. Son sınav bitiş saatini güncelle (2 saat kuralı için referans)
                    if (!studentLastExamEndTimes.has(sId)) studentLastExamEndTimes.set(sId, new Map());
                    studentLastExamEndTimes.get(sId)!.set(dateKey, slot.end);
                }
            }
        }
        remainingCourses = nextLoopCourses;
    }

    if (remainingCourses.length > 0) {
        throw new Error(
            `Takvim oluşturulamadı! Bazı dersler kurallara (Max 2 Sınav, 2 Saat Ara vb.) takıldığı için yerleşemedi:\n` +
            `${remainingCourses.map(c => c.code).join(", ")}\n` +
            `Çözüm: Sınav tarih aralığını uzatın.`
        );
    }

    return schedule;
};

// Zaman Dilimi Oluşturucu (Standart)
function generateTimeSlots(constraints: GenerationConstraints) {
    const slots = [];
    const current = new Date(constraints.startDate);
    const end = new Date(constraints.endDate);
    const [sH, sM] = constraints.dailyStartTime.split(':').map(Number);
    const [eH, eM] = constraints.dailyEndTime.split(':').map(Number);

    while (current <= end) {
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
            slotEnd.setHours(start.getHours() + 2); 
            if (slotEnd <= dayLimit) slots.push({ start: new Date(start), end: new Date(slotEnd) });
            start.setMinutes(start.getMinutes() + 120 + 15); // 15 dk ara ile slot oluşturur
        }
        current.setDate(current.getDate() + 1);
    }
    return slots;
}