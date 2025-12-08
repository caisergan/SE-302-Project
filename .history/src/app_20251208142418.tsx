import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataInput } from './components/DataInput';
import { ScheduleView } from './components/ScheduleView';
import { Settings } from './components/Settings';
import { ConstraintSelector } from './components/ConstraintSelector';
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCourses = await window.api.getCourses();
        const savedClassrooms = await window.api.getClassrooms();
        const savedStudents = await window.api.getStudents();

        setCourses(savedCourses.map((c: any) => ({
          id: c.id.toString(), // ID'lerin string olmasını garantiye alıyoruz
          code: c.code,
          name: c.name,
          enrolledStudents: c.enrolled_students
        })));

        setClassrooms(savedClassrooms.map((r: any) => ({
          id: r.id.toString(),
          name: r.name,
          capacity: r.capacity,
          building: r.building
        })));

        setStudents(savedStudents.map((s: any) => ({
          id: s.id.toString(), // DB ID'si
          studentNumber: s.student_number, // Öğrenci Numarası
          name: s.name,
          email: `${s.student_number.toLowerCase()}@uni.edu`,
          enrolledCourses: s.enrolled_courses || []
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

  const handleGenerateSchedule = () => {
    setShowConstraintModal(true);
  };

  // --- GÜNCELLENEN KISIM: Backend Algoritmasını Çağırır ---
  const handleFinalizeSchedule = async (constraints: GenerationConstraints) => {
    setShowConstraintModal(false);

    try {
      // 1. Backend'deki algoritmayı tetikle
      const result = await window.api.generateSchedule(constraints);

      if (result.success && result.data) {
        // 2. JSON serileştirmesi yüzünden String gelen tarihleri Date objesine çevir
        const parsedSchedule = result.data.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime)
        }));

        // 3. State'i güncelle ve Takvim'i göster
        setSchedule(parsedSchedule);
        setIsGenerated(true);
        setCurrentView(ViewMode.SCHEDULE);
        
        // Konsola bilgi bas (Debugging için)
        console.log(`Schedule generated successfully with ${parsedSchedule.length} sessions.`);
      } else {
        // FR13: Çözüm bulunamazsa veya hata varsa kullanıcıya bildir
        alert(result.error || "No solution found due to constraints (e.g., room capacity or time slots).");
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("An unexpected error occurred while generating the schedule.");
    }
  };
  // ---------------------------------------------------------

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
    </NotificationProvider>
  );
};

export default App;