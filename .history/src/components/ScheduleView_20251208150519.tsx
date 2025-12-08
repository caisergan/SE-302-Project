import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExamSession, Course, Classroom, Student } from '../types';

interface ScheduleViewProps {
  schedule: ExamSession[];
  courses: Course[];
  classrooms: Classroom[];
  students: Student[];
}

type FilterMode = 'all' | 'room' | 'course' | 'student';

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, courses, classrooms, students }) => {
  const { t, i18n } = useTranslation();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Takvimi ilk sınavın olduğu tarihe veya bugüne odakla
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (schedule.length > 0) {
      // Sınavları tarihe göre sırala ve en erken olanı al
      const sorted = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return new Date(sorted[0].startTime);
    }
    return new Date();
  });

  // Filtre modu değişince varsayılan ilk seçeneği otomatik seç
  useEffect(() => {
    if (filterMode === 'room' && classrooms.length > 0) setSelectedEntityId(classrooms[0].id);
    else if (filterMode === 'course' && courses.length > 0) setSelectedEntityId(courses[0].id);
    else if (filterMode === 'student' && students.length > 0) setSelectedEntityId(students[0].id);
  }, [filterMode, classrooms, courses, students]);

  // Haftanın başlangıcını (Pazartesi) hesapla
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0: Pazar, 1: Pazartesi...
    // Pazar ise 6 gün geri git, değilse (gün-1) kadar geri git
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  // Haftanın günlerini oluştur
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // --- FİLTRELEME MANTIĞI (DÜZELTİLDİ) ---
  const filteredSessions = useMemo(() => {
    if (filterMode === 'all') return schedule;
    if (!selectedEntityId) return [];

    return schedule.filter(session => {
      if (filterMode === 'room') {
        return session.classroomId === selectedEntityId;
      }
      
      if (filterMode === 'course') {
        return session.courseId === selectedEntityId;
      }
      
      if (filterMode === 'student') {
        const student = students.find(s => s.id === selectedEntityId);
        if (!student) return false;

        // 1. Öğrencinin aldığı ders kodlarını (örn: "CS101") bul
        const enrolledCodes = student.enrolledCourses || [];

        // 2. Bu kodlara karşılık gelen ders ID'lerini (örn: "5") bul
        // Çünkü session.courseId veritabanı ID'sini tutar.
        const enrolledCourseIds = courses
            .filter(c => enrolledCodes.includes(c.code))
            .map(c => c.id);

        // 3. Sınavın ders ID'si bu listede var mı kontrol et
        return enrolledCourseIds.includes(session.courseId);
      }
      
      return false;
    });
  }, [schedule, filterMode, selectedEntityId, students, courses]);

  // Takvim Görünüm Ayarları
  const START_HOUR = 8;
  const END_HOUR = 20; // Akşam 8'e kadar göster
  const HOURS_COUNT = END_HOUR - START_HOUR + 1;
  const HOUR_HEIGHT = 80; // Satır yüksekliği biraz artırıldı

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

  // --- Render ---

  if (schedule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in">
        <div className="bg-slate-50 p-8 rounded-full mb-4">
            <svg className="w-12 h-12 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
        <p className="text-lg font-medium text-slate-600">{t('dashboard.noSchedule', 'No schedule generated yet')}</p>
        <p className="text-sm text-slate-400 mt-2">{t('schedule.goToDashboard', 'Go to Dashboard to generate one')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
        
        {/* Filters */}
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
            {(['all', 'room', 'student', 'course'] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors whitespace-nowrap ${filterMode === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {t(`schedule.filter${m.charAt(0).toUpperCase() + m.slice(1)}`, m)}
              </button>
            ))}
          </div>

          {filterMode !== 'all' && (
            <div className="relative min-w-[200px] max-w-[300px]">
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm truncate"
              >
                {filterMode === 'room' && classrooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                ))}
                {filterMode === 'course' && courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                ))}
                {filterMode === 'student' && students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentNumber})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          )}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-sm">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-slate-50 border-r border-slate-300 text-slate-600 rounded-l-lg transition-colors"
              title={t('common.previousWeek', 'Previous Week')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium hover:bg-slate-50 border-r border-slate-300 text-slate-700 whitespace-nowrap transition-colors"
            >
              {t('common.today', 'Today')}
            </button>
            <div className="relative">
                <input
                type="date"
                value={currentDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                className="px-2 py-1 text-sm border-none focus:ring-0 text-slate-700 w-[110px] bg-transparent cursor-pointer"
                />
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-slate-50 border-l border-slate-300 text-slate-600 rounded-r-lg transition-colors"
              title={t('common.nextWeek', 'Next Week')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto relative bg-slate-50">
        <div className="min-w-[800px] bg-white m-4 rounded-lg shadow border border-slate-200">
          
          {/* Days Header */}
          <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-slate-200">
            <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-100 flex items-center justify-center bg-slate-50">
              TIME
            </div>
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-slate-100 ${i === 6 ? 'border-r-0' : ''} ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/30' : ''}`}>
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  {day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-800'
                  }`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-8 relative">
            {/* Time Column */}
            <div className="border-r border-slate-200 bg-slate-50">
              {Array.from({ length: HOURS_COUNT }, (_, i) => (
                <div key={i} className="border-b border-slate-200 text-xs text-slate-500 font-medium text-right pr-3 pt-2" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {(START_HOUR + i).toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((day, colIndex) => (
              <div key={colIndex} className={`relative border-r border-slate-100 border-b-0 ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/10' : ''}`}>
                {/* Grid Lines */}
                {Array.from({ length: HOURS_COUNT }, (_, i) => (
                  <div key={i} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }}></div>
                ))}

                {/* Exam Cards */}
                {filteredSessions
                  .filter(s => new Date(s.startTime).toDateString() === day.toDateString())
                  .map(session => {
                    const start = new Date(session.startTime);
                    const end = new Date(session.endTime);

                    // Calculate positioning
                    const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (START_HOUR * 60);
                    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

                    // Skip if out of view bounds (simple check)
                    if (start.getHours() < START_HOUR || start.getHours() > END_HOUR) return null;

                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = (durationMinutes / 60) * HOUR_HEIGHT;

                    const course = courses.find(c => c.id === session.courseId);
                    const room = classrooms.find(r => r.id === session.classroomId);

                    return (
                      <div
                        key={session.id}
                        className="absolute inset-x-1 rounded shadow-sm overflow-hidden hover:shadow-lg transition-all hover:z-50 cursor-pointer group hover:-translate-y-0.5"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: 'rgba(239, 246, 255, 0.95)',
                          borderLeft: '4px solid #6366f1',
                          borderTop: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                        title={`${course?.code} - ${course?.name}`}
                      >
                        <div className="p-2 h-full flex flex-col">
                          <div className="flex justify-between items-start">
                             <div className="text-xs font-bold text-indigo-900 truncate">
                                {course?.code}
                             </div>
                             <div className="text-[10px] text-indigo-400 font-mono">
                                {start.getHours()}:{start.getMinutes().toString().padStart(2, '0')}
                             </div>
                          </div>
                          
                          <div className="text-[10px] text-indigo-700 font-medium truncate leading-tight mt-0.5">
                            {course?.name}
                          </div>
                          
                          <div className="mt-auto pt-1 flex items-center justify-between">
                             {filterMode !== 'room' && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate bg-white/50 px-1.5 py-0.5 rounded">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                  {room?.name}
                                </div>
                              )}
                              {filterMode === 'room' && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate bg-white/50 px-1.5 py-0.5 rounded">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                  {course?.enrolledStudents}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};