import { Course, Classroom, Student, ExamSession, GenerationConstraints } from '../../types';
import { StudentWithCourses } from '../services/studentService';

// Backend tarafındaki tiplerimiz (Frontend'deki tiplerle uyumlu olmalı)
interface SchedulerInput {
    courses: Course[];
    classrooms: Classroom[];
    students: StudentWithCourses[];
    constraints: GenerationConstraints;
}

export const generateSchedule = (input: SchedulerInput): ExamSession[] => {
    const { courses, classrooms, students, constraints } = input;
    const schedule: ExamSession[] = [];

    // 1. ZAMAN DİLİMLERİNİ OLUŞTUR (Time Slots)
    const timeSlots = generateTimeSlots(constraints);
    if (timeSlots.length === 0) throw new Error("No time slots available within the given date range.");

    // 2. ÇATIŞMA MATRİSİ VE ÖĞRENCİ HARİTASI
    // Hangi dersler birbiriyle çakışıyor? (Ortak öğrencisi olanlar)
    const courseConflicts = new Map<string, Set<string>>();
    const courseStudents = new Map<string, Set<string>>(); // CourseCode -> Set<StudentNumbers>

    students.forEach(student => {
        const studentIdentifier = student.student_number; 
        
        // Öğrencinin aldığı dersler arasında çapraz çakışma ekle
        for (let i = 0; i < student.enrolled_courses.length; i++) {
            const courseA = student.enrolled_courses[i];
            
            if (!courseStudents.has(courseA)) courseStudents.set(courseA, new Set());
            courseStudents.get(courseA)!.add(studentIdentifier);

            for (let j = i + 1; j < student.enrolled_courses.length; j++) {
                const courseB = student.enrolled_courses[j];
                
                // Çatışma A -> B
                if (!courseConflicts.has(courseA)) courseConflicts.set(courseA, new Set());
                courseConflicts.get(courseA)!.add(courseB);

                // Çatışma B -> A
                if (!courseConflicts.has(courseB)) courseConflicts.set(courseB, new Set());
                courseConflicts.get(courseB)!.add(courseA);
            }
        }
    });

    // 3. DERSLERİ SIRALA (HEURISTIC: Degree of Saturation)
    // En çok çakışması olan ve en kalabalık dersleri önce yerleştir.
    const sortedCourses = [...courses].sort((a, b) => {
        const conflictsA = courseConflicts.get(a.code)?.size || 0;
        const conflictsB = courseConflicts.get(b.code)?.size || 0;
        if (conflictsA !== conflictsB) return conflictsB - conflictsA; // Önce çok çakışanlar
        return b.enrolledStudents - a.enrolledStudents; // Sonra kalabalık olanlar
    });

    // Takip mekanizmaları
    const roomSchedule = new Map<string, Set<number>>(); // RoomID -> Set<TimeSlotIndex>
    const studentDailyExamCount = new Map<string, Map<string, number>>(); // StudentID -> (DateString -> Count)

    // 4. YERLEŞTİRME DÖNGÜSÜ
    for (const course of sortedCourses) {
        if (course.enrolledStudents === 0) continue; // Öğrencisi olmayan dersi atla

        let assigned = false;

        // Tüm zaman dilimlerini dene
        for (let tIndex = 0; tIndex < timeSlots.length; tIndex++) {
            const slot = timeSlots[tIndex];
            const dateKey = slot.start.toDateString();

            // Tüm sınıfları dene (Kapasiteye uygun olanları filtrele)
            // FR7: Kapasite Kontrolü
            const validClassrooms = classrooms
                .filter(r => r.capacity >= course.enrolledStudents)
                .sort((a, b) => a.capacity - b.capacity); // En küçük uygun sınıfı seç (Best Fit)

            for (const room of validClassrooms) {
                // KONTROL 1: Oda bu saatte dolu mu? (FR8)
                if (roomSchedule.get(room.id.toString())?.has(tIndex)) continue;

                // KONTROL 2: Bu derse kayıtlı öğrencilerin bu saatte başka sınavı var mı? (FR6)
                // KONTROL 3: Öğrencilerin günlük sınav limiti doldu mu? (FR12 - Max 2 exams)
                const enrolledStudents = courseStudents.get(course.code);
                let studentConflict = false;

                if (enrolledStudents) {
                    for (const studentNum of enrolledStudents) {
                        // O anki slotta öğrencinin başka sınavı var mı?
                        // (Bunu schedule array'ini tarayarak yapıyoruz, performans için optimize edilebilir ama şimdilik yeterli)
                        const hasConflict = schedule.some(s => 
                            s.startTime.getTime() === slot.start.getTime() && 
                            courseStudents.get(courses.find(c => c.id === s.courseId)?.code || '')?.has(studentNum)
                        );

                        if (hasConflict) {
                            studentConflict = true;
                            break;
                        }

                        // Günlük Limit Kontrolü (FR12)
                        const dailyCount = studentDailyExamCount.get(studentNum)?.get(dateKey) || 0;
                        if (dailyCount >= 2) {
                            studentConflict = true; 
                            break;
                        }
                    }
                }

                if (studentConflict) continue;

                // --- YERLEŞTİRME YAPILIYOR ---
                schedule.push({
                    id: crypto.randomUUID(),
                    courseId: course.id,
                    classroomId: room.id.toString(),
                    startTime: slot.start,
                    endTime: slot.end
                });

                // Kayıtları Güncelle
                if (!roomSchedule.has(room.id.toString())) roomSchedule.set(room.id.toString(), new Set());
                roomSchedule.get(room.id.toString())!.add(tIndex);

                if (enrolledStudents) {
                    for (const studentNum of enrolledStudents) {
                        if (!studentDailyExamCount.has(studentNum)) studentDailyExamCount.set(studentNum, new Map());
                        const dates = studentDailyExamCount.get(studentNum)!;
                        dates.set(dateKey, (dates.get(dateKey) || 0) + 1);
                    }
                }

                assigned = true;
                break; // Sınıf bulundu, sonraki derse geç
            }
            if (assigned) break; // Slot bulundu, sonraki derse geç
        }

        if (!assigned) {
            // FR13: Çözüm Bulunamadı Raporu
            throw new Error(`Could not schedule course: ${course.code} (${course.name}). Conflict or capacity issue.`);
        }
    }

    return schedule;
};

// Yardımcı Fonksiyon: Zaman Dilimlerini Oluştur
function generateTimeSlots(constraints: GenerationConstraints): { start: Date; end: Date }[] {
    const slots: { start: Date; end: Date }[] = [];
    const current = new Date(constraints.startDate);
    const end = new Date(constraints.endDate);
    
    // Saatleri parse et ("09:00" -> 9, 0)
    const [startHour, startMin] = constraints.dailyStartTime.split(':').map(Number);
    const [endHour, endMin] = constraints.dailyEndTime.split(':').map(Number);

    while (current <= end) {
        // Haftasonu kontrolü
        const day = current.getDay();
        if (!constraints.includeWeekends && (day === 0 || day === 6)) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        // Gün içindeki slotlar (Her sınav varsayılan 2 saat olsun)
        let slotStart = new Date(current);
        slotStart.setHours(startHour, startMin, 0, 0);
        
        const dayEnd = new Date(current);
        dayEnd.setHours(endHour, endMin, 0, 0);

        while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart);
            slotEnd.setHours(slotStart.getHours() + 2); // Sınav süresi varsayılan 2 saat

            if (slotEnd <= dayEnd) {
                slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
            }
            // Bir sonraki sınav 2 saat + 15dk ara sonra başlasın
            slotStart.setMinutes(slotStart.getMinutes() + 120 + 15); 
        }

        current.setDate(current.getDate() + 1);
    }
    return slots;
}