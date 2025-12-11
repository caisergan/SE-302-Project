import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Course, Classroom, Student, ExamSession } from '../types';

interface DashboardProps {
  courses: Course[];
  classrooms: Classroom[];
  students: Student[];
  schedule: ExamSession[];
  isGenerated: boolean;
  isGenerating?: boolean;
  generationError?: string | null;
  onGenerate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  courses, classrooms, students, schedule, isGenerated, isGenerating = false, generationError = null, onGenerate
}) => {
  const { t } = useTranslation();

  const statsData = [
    { name: t('dashboard.activeCourses'), count: courses.length, fill: '#6366f1' },
    { name: t('dashboard.classrooms'), count: classrooms.length, fill: '#8b5cf6' },
    { name: t('dashboard.totalStudents'), count: students.length, fill: '#ec4899' },
  ];

  const capacityData = classrooms.map(r => ({
    name: r.name,
    capacity: r.capacity
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error Alert */}
      {generationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-semibold">{t('dashboard.generationFailed') || 'Schedule Generation Failed'}</div>
            <div className="text-sm mt-1">{generationError}</div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">{t('dashboard.totalCourses')}</div>
          <div className="text-3xl font-bold text-indigo-600 mt-1">{courses.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">{t('dashboard.totalStudents')}</div>
          <div className="text-3xl font-bold text-pink-600 mt-1">{students.length}</div>
          <div className="text-xs text-slate-400 mt-2">
            {t('dataInput.enrolledCourses')}: {students.reduce((acc, s) => acc + s.enrolledCourses.length, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">{t('dashboard.pendingSchedule')}</div>
          <div className={`text-3xl font-bold mt-1 ${isGenerated ? 'text-green-600' : 'text-amber-500'}`}>
            {isGenerated ? t('dashboard.ready') : t('dashboard.notGenerated')}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {isGenerated ? t('dashboard.sessionsScheduled', { count: schedule.length }) : t('dashboard.waitingForAction')}
          </div>
        </div>
      </div>

      {/* Generator Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('dashboard.generateExamSchedule')}</h2>
          <p className="text-indigo-100 max-w-xl">
            {t('dashboard.generateDescription')}
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`${isGenerating ? 'bg-indigo-200 cursor-wait' : 'bg-white hover:bg-indigo-50 transform hover:scale-105'} text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('dashboard.generating') || 'Generating...'}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
              {isGenerated ? t('dashboard.regenerateSchedule') : t('dashboard.runGenerator')}
            </>
          )}
        </button>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.roomCapacities')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="capacity" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left">{t('dashboard.enrollmentDistribution')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={courses as any[]}
                dataKey="enrolledStudents"
                nameKey="code"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {courses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
