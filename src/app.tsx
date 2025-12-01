import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { ScheduleView } from './components/ScheduleView';
import { Settings } from './components/Settings';
import { ConstraintSelector } from './components/ConstraintSelector';
import { ViewMode, Course, Classroom, Student, ExamSession, GenerationConstraints } from './types';
import { MOCK_COURSES, MOCK_CLASSROOMS, MOCK_STUDENTS } from './constants';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);

  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ExamSession[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showConstraintModal, setShowConstraintModal] = useState(false);

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
    setShowConstraintModal(true);
  };

  const handleFinalizeSchedule = (constraints: GenerationConstraints) => {
    setShowConstraintModal(false);
    const newSchedule: ExamSession[] = [];
    let currentDate = new Date(constraints.startDate);
    const endDate = new Date(constraints.endDate);

    const [startHour, startMinute] = constraints.dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = constraints.dailyEndTime.split(':').map(Number);

    let currentCourseIndex = 0;

    while (currentDate <= endDate && currentCourseIndex < courses.length) {
      const dayOfWeek = currentDate.getDay();
      if (!constraints.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      currentDate.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      let dailySessionCount = 0;

      while (currentDate.getTime() + 2 * 60 * 60 * 1000 <= dayEnd.getTime() && currentCourseIndex < courses.length) {
        const course = courses[currentCourseIndex];
        const room = classrooms[currentCourseIndex % classrooms.length];

        newSchedule.push({
          id: `sess-${currentCourseIndex}`,
          courseId: course.id,
          classroomId: room.id,
          startTime: new Date(currentDate),
          endTime: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000),
        });

        currentCourseIndex++;
        dailySessionCount++;

        currentDate.setHours(currentDate.getHours() + 3);
      }

      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-xl font-bold text-slate-800">
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
        <div className="flex-1 overflow-auto p-6 relative">
          {renderContent()}
        </div>

        {/* Constraint Modal Overlay */}
        {showConstraintModal && (
          <ConstraintSelector
            onBack={() => setShowConstraintModal(false)}
            onGenerate={handleFinalizeSchedule}
          />
        )}
      </main>
    </div>
  );
};

export default App;