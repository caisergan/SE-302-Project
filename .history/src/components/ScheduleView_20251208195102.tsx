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

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (schedule.length > 0) {
      const sorted = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return new Date(sorted[0].startTime);
    }
    return new Date();
  });

  // Filtre değişince ilk elemanı seçme mantığı
  useEffect(() => {
    if (filterMode === 'room' && classrooms.length > 0) {
        console.log("Filtre Room Seçildi. İlk sınıf ID:", classrooms[0].id);
        setSelectedEntityId(String(classrooms[0].id));
    }
    else if (filterMode === 'course' && courses.length > 0) setSelectedEntityId(String(courses[0].id));
    else if (filterMode === 'student' && students.length > 0) setSelectedEntityId(String(students[0].id));
  }, [filterMode, classrooms, courses, students]);

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

  // --- DEBUG MODLU FİLTRELEME ---
  const filteredSessions = useMemo(() => {
    if (filterMode === 'all') return schedule;
    if (!selectedEntityId) return [];

    console.log(`Filtreleme Başladı: Mod=${filterMode}, SeçilenID=${selectedEntityId}`);

    const results = schedule.filter(session => {
      const sessionIdStr = String(session.courseId);
      const sessionRoomIdStr = String(session.classroomId);
      const selectedIdStr = String(selectedEntityId);

      if (filterMode === 'room') {
        // Eşleşme kontrolü
        const match = sessionRoomIdStr === selectedIdStr;
        if (match) console.log("Eşleşme Bulundu!", session); // Sadece eşleşenleri logla
        return match;
      }
      
      if (filterMode === 'course') return sessionIdStr === selectedIdStr;
      
      if (filterMode === 'student') {
        const student = students.find(s => String(s.id) === selectedIdStr);
        if (!student) return false;
        const enrolledCodes = (student.enrolledCourses || []).map(c => c.trim().toUpperCase());
        const targetCourseIds = courses
            .filter(c => enrolledCodes.includes(c.code.trim().toUpperCase()))
            .map(c => String(c.id));
        return targetCourseIds.includes(sessionIdStr);
      }
      return false;
    });

    console.log(`Sonuç: ${results.length} adet sınav bulundu.`);
    return results;
  }, [schedule, filterMode, selectedEntityId, students, courses]);
  // ------------------------------

  const START_HOUR = 8;
  const END_HOUR = 20;
  const HOURS_COUNT = END_HOUR - START_HOUR + 1;
  const HOUR_HEIGHT = 80;

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setCurrentDate(new Date(e.target.value));
  };

  if (schedule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
         <p>No schedule generated yet. Go to Dashboard and generate one.</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
        
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
                {t(`schedule.filter${m.charAt(0).toUpperCase() + m.slice(1)}`)}
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
                  <option key={r.id} value={String(r.id)}>{r.name} (Cap: {r.capacity})</option>
                ))}
                {filterMode === 'course' && courses.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.code}: {c.name}</option>
                ))}
                {filterMode === 'student' && students.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.name} ({s.studentNumber})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0">
             <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-sm">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-slate-50 border-r border-slate-300 text-slate-600">Prev</button>
            <button onClick={goToToday} className="px-3 py-2 text-sm font-medium hover:bg-slate-50 border-r border-slate-300 text-slate-700">Today</button>
            <input type="date" value={currentDate.toISOString().split('T')[0]} onChange={handleDateChange} className="px-2 py-1 text-sm border-none focus:ring-0 text-slate-700 w-[110px] bg-transparent cursor-pointer"/>
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-slate-50 border-l border-slate-300 text-slate-600">Next</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative bg-slate-50">
        <div className="min-w-[800px] bg-white m-4 rounded-lg shadow border border-slate-200">
          
          <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-slate-200">
            <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-100 flex items-center justify-center bg-slate-50">TIME</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-slate-100 ${i === 6 ? 'border-r-0' : ''}`}>
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  {day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white' : 'text-slate-800'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 relative">
            <div className="border-r border-slate-200 bg-slate-50">
              {Array.from({ length: HOURS_COUNT }, (_, i) => (
                <div key={i} className="border-b border-slate-200 text-xs text-slate-500 font-medium text-right pr-3 pt-2" style={{ height: `${HOUR_HEIGHT}px` }}>{(START_HOUR + i).toString().padStart(2, '0')}:00</div>
              ))}
            </div>

            {weekDays.map((day, colIndex) => (
              <div key={colIndex} className="relative border-r border-slate-100 border-b-0">
                {Array.from({ length: HOURS_COUNT }, (_, i) => (<div key={i} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }}></div>))}

                {filteredSessions
                  .filter(s => new Date(s.startTime).toDateString() === day.toDateString())
                  .map(session => {
                    const start = new Date(session.startTime);
                    const end = new Date(session.endTime);
                    if (start.getHours() < START_HOUR || start.getHours() > END_HOUR) return null;

                    const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (START_HOUR * 60);
                    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                    const top = (startMinutes / 60) * HOUR_HEIGHT;
                    const height = (durationMinutes / 60) * HOUR_HEIGHT;

                    // ID Eşleşmesi (Güvenli)
                    const course = courses.find(c => String(c.id) === String(session.courseId));
                    const room = classrooms.find(r => String(r.id) === String(session.classroomId));

                    return (
                      <div key={session.id} className="absolute inset-x-1 rounded shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                        style={{ top: `${top}px`, height: `${height}px`, backgroundColor: 'rgba(239, 246, 255, 0.95)', borderLeft: '4px solid #6366f1', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
                        <div className="p-2 h-full flex flex-col">
                          <div className="text-xs font-bold text-indigo-900 truncate">{course?.code}</div>
                          <div className="text-[10px] text-indigo-700 font-medium truncate">{course?.name}</div>
                          
                          {/* Sınıf filtresi seçiliyken öğrenci sayısını göster, değilse sınıf adını göster */}
                          {filterMode !== 'room' ? (
                             <div className="mt-auto pt-1 text-[10px] text-slate-500 truncate">{room?.name}</div>
                          ) : (
                             <div className="mt-auto pt-1 text-[10px] text-indigo-500 font-bold">{course?.enrolledStudents} Students</div>
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
    </div>
  );
};