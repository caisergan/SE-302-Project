import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { ScheduleView } from './components/ScheduleView';
import { Settings } from './components/Settings';
import { ConstraintSelector } from './components/ConstraintSelector';
import { HelpModal } from './components/HelpModal';
import { ViewMode, Course, Classroom, Student, ExamSession, GenerationConstraints } from './types';
import { NotificationProvider } from './context/NotificationContext';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);

  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ExamSession[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showConstraintModal, setShowConstraintModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCourses = await window.api.getCourses();
        const savedClassrooms = await window.api.getClassrooms();
        const savedStudents = await window.api.getStudents();

        setCourses(savedCourses.map((c: any) => ({
          id: c.code,
          code: c.code,
          name: c.name,
          enrolledStudents: c.enrolled_students
        })));

        setClassrooms(savedClassrooms.map((r: any) => ({
          id: r.name,
          name: r.name,
          capacity: r.capacity,
          building: r.building
        })));

        setStudents(savedStudents.map((s: any) => ({
          id: s.student_number,
          name: s.name,
          email: `${s.student_number.toLowerCase()}@uni.edu`,
          enrolledCourses: s.enrolled_courses
        })));
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateSchedule = () => {
    setShowConstraintModal(true);
    setGenerationError(null);
  };

  const handleFinalizeSchedule = async (constraints: GenerationConstraints) => {
    setShowConstraintModal(false);
    setIsGenerating(true);
    setGenerationError(null);

    // Helper to format date as local ISO string (no UTC conversion)
    const toLocalISOString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    try {
      // Call the real scheduling algorithm via IPC (use local dates, not UTC)
      const result = await window.api.generateSchedule({
        startDate: toLocalISOString(constraints.startDate),
        endDate: toLocalISOString(constraints.endDate),
        includeWeekends: constraints.includeWeekends,
        dailyStartTime: constraints.dailyStartTime,
        dailyEndTime: constraints.dailyEndTime,
        maxExamsPerDay: constraints.maxExamsPerDay,
        allowConsecutiveExams: constraints.allowConsecutiveExams,
        minHoursBetweenExams: constraints.minHoursBetweenExams,
      });

      if (result.success) {
        // Convert date strings back to Date objects
        const scheduleWithDates = result.schedule.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime),
        }));

        setSchedule(scheduleWithDates);
        setIsGenerated(true);
        setCurrentView(ViewMode.SCHEDULE);

        // Auto-save the generated schedule to database (keep as local strings)
        const sessionsForSave = result.schedule.map((s: any) => ({
          sessionId: s.id,
          courseCode: s.courseId,
          classroomName: s.classroomId,
          startTime: s.startTime,
          endTime: s.endTime,
        }));
        await window.api.saveSchedule(sessionsForSave);

        console.log(`Schedule generated and saved successfully in ${result.stats?.generationTimeMs}ms`);
      } else {
        // No valid schedule found - show user-friendly error
        const errorWithSuggestion = `${result.message}\n\nSuggestions:\n• Add more classrooms\n• Extend the exam date range\n• Reduce overlapping student enrollments`;
        setGenerationError(errorWithSuggestion);
        setIsGenerated(false);
        console.error('Schedule generation failed:', result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorWithSuggestion = `${errorMessage}\n\nPlease check your data and try again.`;
      setGenerationError(errorWithSuggestion);
      setIsGenerated(false);
      console.error('Schedule generation error:', error);
    } finally {
      setIsGenerating(false);
    }
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
            isGenerating={isGenerating}
            generationError={generationError}
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
    <NotificationProvider>
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
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title={t('help.title') || 'Help'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
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

          {/* Help Modal */}
          <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
        </main>
      </div>
    </NotificationProvider>
  );
};

export default App;