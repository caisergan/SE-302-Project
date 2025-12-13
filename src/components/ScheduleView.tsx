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

// --- YENİ: DETAY MODALI (Tıklayınca Açılan Liste) ---
const SessionDetailModal = ({ sessions, courses, classrooms, onClose }: any) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Exam Details</h3>
                        <p className="text-sm text-slate-500">
                            {new Date(sessions[0].startTime).toLocaleDateString()} • {new Date(sessions[0].startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">✕</button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {sessions.map((s: any) => {
                        const c = courses.find((x: any) => String(x.id) === String(s.courseId));
                        const r = classrooms.find((x: any) => String(x.id) === String(s.classroomId));
                        return (
                            <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {c?.code.slice(-2)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{c?.code}</div>
                                        <div className="text-sm text-slate-500">{c?.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{c?.enrolledStudents} Students</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                                        {r?.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, courses, classrooms, students }) => {
  const { t, i18n } = useTranslation();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // YENİ: Modal State'i
  const [selectedSlotSessions, setSelectedSlotSessions] = useState<ExamSession[] | null>(null);

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (schedule.length > 0) {
      return new Date(schedule[0].startTime);
    }
    return new Date();
  });

  useEffect(() => {
    if (filterMode === 'room' && classrooms.length > 0) setSelectedEntityId(String(classrooms[0].id));
    else if (filterMode === 'course' && courses.length > 0) setSelectedEntityId(String(courses[0].id));
    else if (filterMode === 'student' && students.length > 0) setSelectedEntityId(String(students[0].id));
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
    d.setDate(diff); d.setHours(0, 0, 0, 0); return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
    });
  }, [weekStart]);

  const filteredSessions = useMemo(() => {
    if (filterMode === 'all') return schedule;
    if (!selectedEntityId) return [];

    return schedule.filter(session => {
      const sId = String(session.courseId);
      const rId = String(session.classroomId);
      const selId = String(selectedEntityId);

      if (filterMode === 'room') return rId === selId;
      if (filterMode === 'course') return sId === selId;
      if (filterMode === 'student') {
        const student = students.find(s => String(s.id) === selId);
        if(!student) return false;
        const codes = (student.enrolledCourses || []).map(c=>c.trim());
        const crs = courses.find(c => String(c.id) === sId);
        return crs && codes.includes(crs.code);
      }
      return false;
    });
  }, [schedule, filterMode, selectedEntityId, students, courses]);

  // YENİ: Gruplama Mantığı (Aynı saattekileri yakala)
  const getGroupedSessions = (daySessions: ExamSession[]) => {
      const groups: { key: string, sessions: ExamSession[], startTime: Date }[] = [];
      daySessions.forEach(session => {
          const timeKey = new Date(session.startTime).getTime().toString();
          const existing = groups.find(g => g.key === timeKey);
          if (existing) existing.sessions.push(session);
          else groups.push({ key: timeKey, sessions: [session], startTime: new Date(session.startTime) });
      });
      return groups;
  };

  const START_HOUR = 8;
  const END_HOUR = 22;
  const HOURS_COUNT = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 80; // Biraz yükselttim (Kartlar sığsın diye)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setCurrentDate(new Date(e.target.value));
  };

  const handleExport = async () => {
    setIsExporting(true); setExportMessage(null);
    try {
      const sessionsForExport = schedule.map(s => ({
        sessionId: s.id, courseCode: s.courseId, classroomName: s.classroomId,
        startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
        endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
      }));
      const result = await window.api.exportScheduleCSV({
        sessions: sessionsForExport,
        courses: courses.map(c => ({ id: c.id, code: c.code, name: c.name })),
        classrooms: classrooms.map(c => ({ id: c.id, name: c.name })),
      });
      setExportMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch (error) {
      setExportMessage({ type: 'error', text: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally { setIsExporting(false); }
  };

  if (schedule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <svg className="w-16 h-16 mb-4 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <p className="text-lg font-medium">{t('dashboard.noSchedule')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      {exportMessage && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${exportMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{exportMessage.text}</div>
      )}

      {/* HEADER (ORİJİNAL) */}
      <div className="p-4 border-b border-slate-200 flex gap-4 justify-between items-center bg-slate-50/50 overflow-x-auto">
        <div className="flex items-center gap-4 flex-nowrap min-w-max">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
            {(['all', 'room', 'student', 'course'] as FilterMode[]).map((m) => (
              <button key={m} onClick={() => setFilterMode(m)} className={`px-4 py-2 text-sm font-medium capitalize transition-colors whitespace-nowrap ${filterMode === m ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {t(`schedule.filter${m.charAt(0).toUpperCase() + m.slice(1)}`)}
              </button>
            ))}
          </div>

          {filterMode !== 'all' && (
            <div className="relative min-w-[200px] max-w-[300px] animate-fade-in">
              <select value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm truncate">
                {filterMode === 'room' && classrooms.map(r => <option key={r.id} value={r.id}>{r.name} ({t('schedule.capacityShort', { capacity: r.capacity })})</option>)}
                {filterMode === 'course' && courses.map(c => <option key={c.id} value={c.id}>{c.code}: {c.name}</option>)}
                {filterMode === 'student' && students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button onClick={handleExport} disabled={isExporting} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg shadow-sm whitespace-nowrap ${isExporting ? 'bg-slate-100 text-slate-400 cursor-wait' : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'}`}>
            {isExporting ? 'Exporting...' : t('schedule.export')}
          </button>
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-sm shrink-0">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-slate-50 border-r border-slate-300 text-slate-600">←</button>
            <button onClick={goToToday} className="px-3 py-2 text-sm font-medium hover:bg-slate-50 border-r border-slate-300 text-slate-700 whitespace-nowrap">{t('common.today') || 'Today'}</button>
            <input type="date" value={currentDate.toISOString().split('T')[0]} onChange={handleDateChange} className="px-2 py-1 text-sm border-none focus:ring-0 text-slate-700 w-[130px]" />
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-slate-50 border-l border-slate-300 text-slate-600">→</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
            <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-100">GMT+0</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r border-slate-100 ${i === 6 ? 'border-r-0' : ''}`}>
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">{day.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}</div>
                <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white' : 'text-slate-800'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 relative">
            {/* SAAT SÜTUNU */}
            <div className="border-r border-slate-200 bg-slate-50/50">
              {Array.from({ length: HOURS_COUNT }, (_, i) => (
                <div key={i} className="border-b border-slate-200 text-xs text-slate-400 text-right pr-2 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>{(START_HOUR + i).toString().padStart(2, '0')}:00</div>
              ))}
              <div className="text-xs text-slate-400 text-right pr-2 pt-1" style={{ height: '20px' }}>{END_HOUR}:00</div>
            </div>

            {/* GÜNLER */}
            {weekDays.map((day, colIndex) => {
              const daySessions = filteredSessions.filter(s => new Date(s.startTime).toDateString() === day.toDateString());
              const groups = getGroupedSessions(daySessions);

              return (
                <div key={colIndex} className="relative border-r border-slate-100 border-b-0">
                  {Array.from({ length: HOURS_COUNT }, (_, i) => (<div key={i} className="border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }}></div>))}

                  {/* STACKED CARDS MANTIĞI */}
                  {groups.map(group => {
                      const start = group.startTime;
                      const end = new Date(group.sessions[0].endTime); // Hepsi aynı saatte bitiyor kabulü

                      const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (START_HOUR * 60);
                      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

                      const top = (startMinutes / 60) * HOUR_HEIGHT;
                      const height = (durationMinutes / 60) * HOUR_HEIGHT;
                      
                      const course = courses.find(c => String(c.id) === String(group.sessions[0].courseId));
                      const room = classrooms.find(r => String(r.id) === String(group.sessions[0].classroomId));

                      return (
                          <div key={group.key} 
                               className="absolute w-[95%] left-[2.5%] cursor-pointer group z-10 hover:z-50"
                               style={{ top: `${top}px`, height: `${height}px` }}
                               onClick={() => setSelectedSlotSessions(group.sessions)}
                          >
                               {/* ARKADAKİ KARTLAR (Stack Effect) */}
                               {group.sessions.length > 1 && (
                                   <>
                                     <div className="absolute inset-0 bg-white border border-slate-300 rounded shadow-sm rotate-3 opacity-60 translate-x-1 translate-y-1"></div>
                                     <div className="absolute inset-0 bg-white border border-slate-300 rounded shadow-sm -rotate-2 opacity-80 -translate-x-1 translate-y-2"></div>
                                   </>
                               )}

                               {/* EN ÜSTTEKİ KART */}
                               <div className="relative inset-0 h-full rounded border-l-4 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 bg-blue-50/95 border-indigo-500 border border-slate-200">
                                   <div className="p-2 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div className="text-xs font-bold text-indigo-900 truncate">{course?.code}</div>
                                                {group.sessions.length > 1 && (
                                                    <span className="text-[9px] bg-slate-800 text-white px-1.5 rounded-full font-bold shadow">
                                                        +{group.sessions.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-indigo-700 font-medium truncate leading-tight mt-0.5">{course?.name}</div>
                                        </div>
                                        
                                        <div className="mt-auto pt-1 text-[9px] text-indigo-500 flex items-center gap-1 truncate border-t border-blue-100">
                                            {filterMode !== 'room' && (
                                                <><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span> {room?.name}</>
                                            )}
                                            {filterMode === 'room' && (
                                                <><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span> {course?.enrolledStudents} students</>
                                            )}
                                            {group.sessions.length > 1 && <span className="text-slate-400 italic ml-1">& others</span>}
                                        </div>
                                   </div>
                               </div>
                          </div>
                      );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* MODAL ENTEGRASYONU */}
      {selectedSlotSessions && (
          <SessionDetailModal 
            sessions={selectedSlotSessions} 
            courses={courses} 
            classrooms={classrooms} 
            onClose={() => setSelectedSlotSessions(null)} 
          />
      )}
    </div>
  );
};