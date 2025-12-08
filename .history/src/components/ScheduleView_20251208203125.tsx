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
      const sorted = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return new Date(sorted[0].startTime);
    }
    return new Date();
  });

  // Filtre modu değişince varsayılan ilk seçeneği seç
  useEffect(() => {
    if (filterMode === 'room' && classrooms.length > 0) setSelectedEntityId(String(classrooms[0].id));
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

  // --- CSV DIŞA AKTARMA (EXPORT) ---
  const handleExport = () => {
    if (schedule.length === 0) {
      alert("No schedule generated to export.");
      return;
    }

    const headers = ["Session ID", "Course Code", "Course Name", "Classroom", "Date", "Start Time", "End Time"];

    const rows = schedule.map(session => {
      const course = courses.find(c => String(c.id) === String(session.courseId));
      const room = classrooms.find(r => String(r.id) === String(session.classroomId));
      
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);

      return [
        session.id,
        course?.code || "Unknown",
        course?.name || "Unknown",
        room?.name || "Unknown",
        start.toLocaleDateString(),
        start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ].map(field => `"${field}"`).join(","); 
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "exam_schedule_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- GELİŞMİŞ FİLTRELEME ---
  const filteredSessions = useMemo(() => {
    if (filterMode === 'all') return schedule;
    if (!selectedEntityId) return [];

    return schedule.filter(session => {
      const sessionIdStr = String(session.courseId);
      const sessionRoomIdStr = String(session.classroomId);
      const selectedIdStr = String(selectedEntityId);

      if (filterMode === 'room') return sessionRoomIdStr === selectedIdStr;
      
      if (filterMode === 'course') return sessionIdStr === selectedIdStr;
      
      if (filterMode === 'student') {
        const student = students.find(s => String(s.id) === selectedIdStr);
        if (!student) return false;

        const enrolledCodes = (student.enrolledCourses || []).map(c => c.trim().toUpperCase());
        
        // Öğrencinin aldığı derslerin ID'lerini bul
        const targetCourseIds = courses
            .filter(c => enrolledCodes.includes(c.code.trim().toUpperCase()))
            .map(c => String(c.id));

        return targetCourseIds.includes(sessionIdStr);
      }
      
      return false;
    });
  }, [schedule, filterMode, selectedEntityId, students, courses]);

  // Görünüm Ayarları
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

        {/* Controls */}
        <div className="flex items-center gap-4 shrink-0">
          {/* EXPORT BUTTON */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            {t('schedule.export')}
          </button>

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

                    const course = courses.find(c => String(c.id) === String(session.courseId));
                    const room = classrooms.find(r => String(r.id) === String(session.classroomId));

                    return (
                      <div key={session.id} className="absolute inset-x-1 rounded shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group hover:z-50"
                        style={{ 
                            top: `${top}px`, 
                            height: `${height}px`, 
                            backgroundColor: 'rgba(239, 246, 255, 0.85)', // Hafif Şeffaf (Arkası görünsün diye)
                            borderLeft: '4px solid #6366f1', 
                            border: '1px solid #e2e8f0', 
                            borderLeftWidth: '4px',
                            width: '90%', // Genişlik %90 (Üst üste binmeyi görmek için)
                            zIndex: 10
                        }}>
                        <div className="p-2 h-full flex flex-col">
                          <div className="text-xs font-bold text-indigo-900 truncate">{course?.code}</div>
                          <div className="text-[10px] text-indigo-700 font-medium truncate">{course?.name}</div>
                          
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