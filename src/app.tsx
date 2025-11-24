import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { ScheduleView } from './components/ScheduleView';
import { Settings } from './components/Settings';
import { ViewMode, Course, Classroom, Student, ExamSession } from './types';
import { MOCK_COURSES, MOCK_CLASSROOMS, MOCK_STUDENTS } from './constants';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);

  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ExamSession[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    setCourses(MOCK_COURSES);
    setClassrooms(MOCK_CLASSROOMS);
    setStudents(MOCK_STUDENTS);

    const handleNavigate = (event: CustomEvent) => {
      const viewName = event.detail;
      const viewMap: { [key: string]: ViewMode } = {
        'Dashboard': ViewMode.DASHBOARD,
        'Data Management': ViewMode.DATA,
        'Schedule View': ViewMode.SCHEDULE,
        'Settings': ViewMode.SETTINGS,
      };
      if (viewMap[viewName]) {
        setCurrentView(viewMap[viewName]);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  const handleGenerateSchedule = () => {
    const newSchedule: ExamSession[] = [];
    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0);

    courses.forEach((course, index) => {
      const room = classrooms[index % classrooms.length];
      const examTime = new Date(startDate);
      examTime.setHours(9 + (index % 3) * 3);
      examTime.setDate(startDate.getDate() + Math.floor(index / 3));

      newSchedule.push({
        id: `sess-${index}`,
        courseId: course.id,
        classroomId: room.id,
        startTime: examTime,
        endTime: new Date(examTime.getTime() + 2 * 60 * 60 * 1000),
      });
    });

    setSchedule(newSchedule);
    setIsGenerated(true);
    setCurrentView(ViewMode.SCHEDULE);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewMode.DASHBOARD:
        return (
          <Dashboard
            courses={courses}
            classrooms={classrooms}
            students={students}
            schedule={schedule}
            isGenerated={isGenerated}
            onGenerate={handleGenerateSchedule}
          />
        );
      case ViewMode.DATA:
        return (
          <DataInput
            courses={courses} setCourses={setCourses}
            classrooms={classrooms} setClassrooms={setClassrooms}
            students={students} setStudents={setStudents}
          />
        );
      case ViewMode.SCHEDULE:
        return (
          <ScheduleView
            schedule={schedule}
            courses={courses}
            classrooms={classrooms}
            students={students}
          />
        );
      case ViewMode.SETTINGS:
        return <Settings />;
      default:
        return <div className="p-8">View not found</div>;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 h-full overflow-hidden flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
            {currentView === ViewMode.DASHBOARD && t('common.dashboard')}
            {currentView === ViewMode.DATA && t('common.dataManagement')}
            {currentView === ViewMode.SCHEDULE && t('common.scheduleView')}
            {currentView === ViewMode.SETTINGS && t('common.settings')}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-500">Academic Year 2024-2025</div>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              SA
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;