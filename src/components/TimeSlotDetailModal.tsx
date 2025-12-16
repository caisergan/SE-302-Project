import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ExamSession, Course, Classroom } from '../types';

interface TimeSlotDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    exams: ExamSession[];
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

    // Color palette for different classrooms
    const classroomColors = [
        { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' },
        { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
        { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
        { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
        { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
        { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
        { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
        { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700' },
    ];

    // Map classrooms to colors
    const classroomColorMap = new Map<string, typeof classroomColors[0]>();
    const uniqueClassrooms = [...new Set(exams.map(e => e.classroomId))];
    uniqueClassrooms.forEach((classroomId, index) => {
        classroomColorMap.set(classroomId, classroomColors[index % classroomColors.length]);
    });

    // Use Portal to render modal at document body level
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {t('schedule.timeSlotDetails')}
                            </h2>
                            <p className="text-indigo-100 text-sm mt-1">
                                {formatDate(timeSlot.start)}
                            </p>
                            <p className="text-indigo-200 text-sm">
                                {formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                            title={t('common.cancel')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {t('schedule.multipleExams', { count: exams.length })}
                        </span>
                    </div>
                </div>

                {/* Exam List */}
                <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4 space-y-3">
                    {exams.map((exam, index) => {
                        const course = courses.find(c => c.id === exam.courseId);
                        const classroom = classrooms.find(c => c.id === exam.classroomId);
                        const colorScheme = classroomColorMap.get(exam.classroomId) || classroomColors[0];

                        return (
                            <div
                                key={exam.id}
                                className={`${colorScheme.bg} border-l-4 ${colorScheme.border} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold text-lg ${colorScheme.text}`}>
                                                {course?.code || exam.courseId}
                                            </span>
                                            <span className="text-slate-400 text-sm">#{index + 1}</span>
                                        </div>
                                        <p className="text-slate-700 font-medium">
                                            {course?.name || t('common.noData')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                    {/* Classroom */}
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span className="font-medium">
                                            {classroom?.name || exam.classroomId}
                                        </span>
                                        {classroom && (
                                            <span className="text-slate-400">
                                                ({t('schedule.capacityShort', { capacity: classroom.capacity })})
                                            </span>
                                        )}
                                    </div>

                                    {/* Enrolled Students */}
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <span>
                                            {t('schedule.enrolledCount', { count: course?.enrolledStudents || 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
