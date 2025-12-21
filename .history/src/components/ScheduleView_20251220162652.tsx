import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExamSession, Course, Classroom, Student } from '../types';
import { TimeSlotDetailModal } from './TimeSlotDetailModal';

interface ScheduleViewProps {
  schedule: ExamSession[];
  courses: Course[];
  classrooms: Classroom[];
  students: Student[];
}

// UI için genişletilmiş tip (Split sınavları göstermek için)
interface DisplaySession extends ExamSession {
  isSplit?: boolean;
  classroomList?: { name: string; count: number }[]; // Sınıf listesi
  totalStudents?: number;
}

type FilterMode = 'all' | 'room' | 'course' | 'student';

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, courses, classrooms, students }) => {
  const { t, i18n } = useTranslation();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Time slot detail modal state
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedTimeSlotExams, setSelectedTimeSlotExams] = useState<ExamSession[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: Date; end: Date } | null>(null);

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (schedule.length > 0) {
      return new Date(schedule[0].startTime);
    }
    return new Date();
  });

  useEffect(() => {
    if (filterMode === 'room' && classrooms.length > 0) setSelectedEntityId(classrooms[0].id);
    else if (filterMode === 'course' && courses.length > 0) setSelectedEntityId(courses[0].id);
    else if (filterMode === 'student' && students.length > 0) setSelectedEntityId(students[0].id);
  }, [filterMode, classrooms, courses, students]);

  useEffect(() => {
    if (exportMessage) {
      const timer = setTimeout(() => setExportMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [exportMessage]);

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // 1. Adım: Ham filtreleme (Mevcut mantık)
  const rawFilteredSessions = useMemo(() => {
    if (filterMode === 'all') return schedule;
    if (!selectedEntityId) return [];

    return schedule.filter(session => {
      if (filterMode === 'room') return session.classroomId === selectedEntityId;
      if (filterMode === 'course') return session.courseId === selectedEntityId;
      if (filterMode === 'student') {
        const student = students.find(s => s.id === selectedEntityId);
        return student?.enrolledCourses.includes(session.courseId);
      }
      return false;
    });
  }, [schedule, filterMode, selectedEntityId, students]);

  // 2. Adım: Split Sınavları Birleştirme (YENİ EKLENEN MANTIK)
  // Eğer 'Room' modunda değilsek, aynı dersin aynı saatteki parçalarını birleştiriyoruz.
  const processedSessions = useMemo(() => {
    // Oda görünümünde birleştirme yapmamalıyız çünkü sadece o odayı görmek istiyoruz.
    if (filterMode === 'room') return rawFilteredSessions as DisplaySession[];

    const groupedMap = new Map<string, DisplaySession>();

    rawFilteredSessions.forEach(session => {
      // Ders Kodu + Başlangıç Saati birleşim anahtarıdır
      const key = `${session.courseId}-${new Date(session.startTime).toISOString()}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ...session,
          isSplit: false,
          classroomList: [{ name: session.classroomId, count: session.studentCount || 0 }],
          totalStudents: session.studentCount || 0
        });
      } else {
        const existing = groupedMap.get(key)!;
        existing.isSplit = true; // Bu artık bölünmüş bir sınav
        existing.classroomList?.push({ name: session.classroomId, count: session.studentCount || 0 });
        existing.totalStudents = (existing.totalStudents || 0) + (session.studentCount || 0);
      }
    });

    return Array.from(groupedMap.values());
  }, [rawFilteredSessions, filterMode]);

  // 3. Adım: Zaman dilimine göre gruplama (Processed sessions üzerinden)
  const groupedSessionsByTimeSlot = useMemo(() => {
    const groups = new Map<string, DisplaySession[]>();

    processedSessions.forEach(session => {
      const startTime = new Date(session.startTime);
      const key = startTime.toISOString();

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });

    return groups;
  }, [processedSessions]);

  const handleTimeSlotClick = (exams: DisplaySession[]) => {
    if (exams.length > 0) {
      // Modal'a ham veriyi değil, gerekirse açılmış veriyi gönderebiliriz
      // Ancak şimdilik özet gösterimi yeterli
      setSelectedTimeSlotExams(exams);
      setSelectedTimeSlot({
        start: new Date(exams[0].startTime),
        end: new Date(exams[0].endTime),
      });
      setShowTimeSlotModal(true);
    }
  };

  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOURS_COUNT = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 80; // Sınıf listesi sığsın diye yüksekliği biraz artırdım (64 -> 80)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const sessionsForExport = schedule.map(s => ({
        sessionId: s.id,
        courseCode: s.courseId,
        classroomName: s.classroomId,
        startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
        endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
      }));

      const result = await window.api.exportScheduleCSV({
        sessions: sessionsForExport,
        courses: courses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        classrooms: classrooms.map(c => ({ id: c.id, name: c.name })),
      });

      if (result.success) {
        setExportMessage({ type: 'success', text: result.message });
      } else {
        setExportMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setExportMessage({ type: 'error', text: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsExporting(false);
    }
  };

  if (schedule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <p className="text-lg font-medium">{t('dashboard.noSchedule')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toast Message */}
      {exportMessage && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${exportMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {exportMessage.text}
        </div>
      )}

      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 flex gap-4 justify-between items-center bg-slate-50/50 overflow-x-auto">
        <div className="flex items-center gap-4 flex-nowrap min-w-max">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
            {(['all', 'room', 'student', 'course'] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors whitespace-nowrap ${filterMode === m ? 'bg-ieu-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {t(`schedule.filter${m.charAt(0).toUpperCase() + m.slice(1)}`)}
              </button>
            ))}
          </div>

          {filterMode !== 'all' && (
            <div className="relative min-w-[200px] max-w-[300px]">
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-ieu-500 shadow-sm truncate"
              >
                {filterMode === 'room' && classrooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}
                {filterMode === 'course' && courses.map(c => <option key={c.id} value={c.id}>{c.code}: {c.name}</option>)}
                {filterMode === 'student' && students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg shadow-sm whitespace-nowrap bg-white hover:bg-slate-50">
            {isExporting ? 'Exporting...' : t('schedule.export')}
          </button>
          
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-sm shrink-0">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-slate-50 border-r border-slate-300 text-slate-600">
                &lt;
            </button>
            <button onClick={goToToday} className="px-3 py-2 text-sm font-medium hover:bg-slate-50 border-r border-slate-300 text-slate-700 whitespace-nowrap">
              {t('common.today') || 'Today'}
            </button>
            <input type="date" value={currentDate.toISOString().split('T')[0]} onChange={handleDateChange} className="px-2 py-1 text-sm border-none focus:ring-0 text-slate-700 w-[130px]" />
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-slate-50 border-l border-slate-300 text-slate-600">
                &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[1000px]"> {/* Genişliği artırdım */}
          <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
            <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-100">Time</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-slate-100 ${i === 6 ? 'border-r-0' : ''}`}>
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  {day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${day.toDateString() === new Date().toDateString() ? 'bg-ieu-500 text-white' : 'text-slate-800'}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 relative">
            {/* Time Column */}
            <div className="border-r border-slate-200 bg-slate-50/50">
              {Array.from({ length: HOURS_COUNT }, (_, i) => (
                <div key={i} className="border-b border-slate-200 text-xs text-slate-400 text-right pr-2 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {(START_HOUR + i).toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((day, colIndex) => (
              <div key={colIndex} className="relative border-r border-slate-100 border-b-0">
                {Array.from({ length: HOURS_COUNT }, (_, i) => (
                  <div key={i} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }}></div>
                ))}

                {Array.from(groupedSessionsByTimeSlot.entries())
                  .filter(([key]) => new Date(key).toDateString() === day.toDateString())
                  .map(([timeKey, examsInSlot]) => {
                    const start = new Date(timeKey);
                    const end = new Date(examsInSlot[0].endTime);
                    const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (START_HOUR * 60);
                    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = (durationMinutes / 60) * HOUR_HEIGHT;

                    // Eğer aynı saatte birden fazla FARKLI ders varsa (Örn: Math ve Physics)
                    const isMultipleDifferentExams = examsInSlot.length > 1;
                    const firstExam = examsInSlot[0];
                    const course = courses.find(c => c.id === firstExam.courseId);
                    
                    // Tek bir ders var ama Split edilmişse
                    const isSplitExam = firstExam.isSplit;

                    return (
                      <div
                        key={timeKey}
                        className="absolute inset-x-1 rounded border-l-4 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: isMultipleDifferentExams ? 'rgba(219, 234, 254, 0.98)' : (isSplitExam ? '#fff7ed' : 'rgba(239, 246, 255, 0.95)'), // Split ise turuncu tonu
                          borderColor: isMultipleDifferentExams ? '#3b82f6' : (isSplitExam ? '#f97316' : '#6366f1'),
                          borderWidth: '1px',
                          borderLeftWidth: '4px'
                        }}
                        onClick={() => handleTimeSlotClick(examsInSlot)}
                      >
                        <div className="p-2 h-full flex flex-col">
                          {isMultipleDifferentExams ? (
                            /* --- SENARYO 1: AYNI SAATTE FARKLI DERSLER --- */
                            <>
                              <div className="flex items-center gap-1 mb-1">
                                <div className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {examsInSlot.length}
                                </div>
                                <span className="text-xs font-bold text-blue-900">
                                  {t('schedule.multipleExams', { count: examsInSlot.length })}
                                </span>
                              </div>
                              <div className="text-[10px] text-blue-700 font-medium leading-tight space-y-0.5 overflow-hidden flex-1">
                                {examsInSlot.slice(0, 2).map((exam, idx) => (
                                  <div key={idx} className="truncate">
                                    • {courses.find(c => c.id === exam.courseId)?.code || exam.courseId}
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            /* --- SENARYO 2: TEK DERS (Split veya Normal) --- */
                            <>
                              <div className="text-xs font-bold text-ieu-800 truncate">
                                {course?.code}
                              </div>
                              <div className="text-[10px] text-ieu-600 font-medium truncate leading-tight">
                                {course?.name}
                              </div>

                              <div className="mt-auto pt-1">
                                {isSplitExam ? (
                                  // --- SPLIT SINAV GÖSTERİMİ ---
                                  <div className="flex flex-wrap gap-1 content-end">
                                    {firstExam.classroomList?.map((cr, idx) => (
                                      <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                        {classrooms.find(r => r.id === cr.name)?.name || cr.name}
                                        <span className="ml-1 opacity-75">({cr.count})</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  // --- NORMAL SINAV GÖSTERİMİ ---
                                  <div className="text-[10px] text-ieu-500 flex items-center gap-1 truncate">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {classrooms.find(r => r.id === firstExam.classroomId)?.name || firstExam.classroomId}
                                    {firstExam.studentCount && <span className='opacity-75'>({firstExam.studentCount})</span>}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <TimeSlotDetailModal
        isOpen={showTimeSlotModal}
        onClose={() => setShowTimeSlotModal(false)}
        exams={selectedTimeSlotExams}
        courses={courses}
        classrooms={classrooms}
        timeSlot={selectedTimeSlot}
      />
    </div>
  );
};