import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { DisplaySession, Course, Classroom } from '../types'; // Use DisplaySession

interface TimeSlotDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    exams: DisplaySession[]; // Changed from ExamSession[]
    courses: Course[];
    classrooms: Classroom[];
    timeSlot: { start: Date; end: Date } | null;
}

export const TimeSlotDetailModal: React.FC<TimeSlotDetailModalProps> = ({
    isOpen,
    onClose,
    exams,
    courses,
    classrooms,
    timeSlot,
}) => {
    const { t, i18n } = useTranslation();

    if (!isOpen || !timeSlot) return null;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // This creates a more visually distinct set of colors
    const a = [
        { bg: 'bg-ieu-50', border: 'border-ieu-300', text: 'text-ieu-800' },
        { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' },
        { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-800' },
        { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
        { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800' },
        { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
        { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800' },
        { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
    ]

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-ieu-500 to-ieu-600 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {t('schedule.timeSlotDetails')}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {formatDate(timeSlot.start)}
                                <span className="mx-2 text-slate-300">|</span>
                                {formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
                            title={t('common.close')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>
                        </button>
                    </div>
                </div>

                {/* Exam List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                    {exams.map((exam, index) => {
                        const course = courses.find(c => c.id === exam.courseId);
                        
                        return (
                            <div
                                key={exam.id}
                                className={`bg-white border rounded-lg shadow-sm overflow-hidden`}
                            >
                                {/* Course Info Header */}
                                <div className="p-4 bg-slate-50/70 border-b">
                                     <h3 className="font-bold text-lg text-ieu-800">
                                        {course?.code || exam.courseId}
                                    </h3>
                                    <p className="text-slate-600 font-medium text-sm">
                                        {course?.name || t('common.noData')}
                                    </p>
                                </div>
                                
                                {/* Body (SPLIT LOGIC HERE) */}
                                <div className="p-4">
                                    {exam.isSplit ? (
                                        // --- RENDER SPLIT EXAM ---
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-semibold text-slate-700">
                                                    {t('schedule.splitClassrooms')}
                                                </h4>
                                                <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                    {t('schedule.enrolledCount', { count: exam.totalStudents || course?.enrolledStudents || 0 })}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {exam.classroomList?.map((cr, index) => {
                                                     const classroom = classrooms.find(c => c.id === cr.name);
                                                     return (
                                                         <div key={index} className="flex items-center justify-between bg-slate-50 rounded-md p-2 pl-3 border">
                                                             <div className="flex items-center gap-2">
                                                                <svg className="text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                                <span className="font-medium text-slate-700">{classroom?.name || cr.name}</span>
                                                                <span className="text-xs text-slate-400">({t('schedule.capacityShort', { capacity: classroom?.capacity || 0 })})</span>
                                                             </div>
                                                             <span className="text-sm font-semibold text-slate-600">
                                                                {t('schedule.studentCount', { count: cr.count })}
                                                             </span>
                                                         </div>
                                                     )
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        // --- RENDER NORMAL EXAM ---
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                <span className="font-medium">{classrooms.find(c=>c.id === exam.classroomId)?.name || exam.classroomId}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                                <span>{t('schedule.enrolledCount', { count: exam.studentCount || course?.enrolledStudents || 0 })}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};