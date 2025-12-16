import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GenerationConstraints } from '../types';

interface ConstraintSelectorProps {
    onBack: () => void;
    onGenerate: (constraints: GenerationConstraints) => void;
}

export const ConstraintSelector: React.FC<ConstraintSelectorProps> = ({ onBack, onGenerate }) => {
    const { t } = useTranslation();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 14);

    const [startDate, setStartDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(nextWeek.toISOString().split('T')[0]);
    const [includeWeekends, setIncludeWeekends] = useState<boolean>(false);
    const [dailyStartTime, setDailyStartTime] = useState<string>("09:00");
    const [dailyEndTime, setDailyEndTime] = useState<string>("17:00");
    const [maxExamsPerDay, setMaxExamsPerDay] = useState<number>(2);
    const [minHoursBetweenExams, setMinHoursBetweenExams] = useState<number>(1);

    const handleGenerate = () => {
        onGenerate({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            includeWeekends,
            dailyStartTime,
            dailyEndTime,
            maxExamsPerDay,
            allowConsecutiveExams: true, // Let minHoursBetweenExams control the gap validation
            minHoursBetweenExams
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {t('constraintsModal.title')}
                    </h2>
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Date Range Section */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                                {t('constraintsModal.dateRange')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraintsModal.startDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraintsModal.endDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex items-center pt-1">
                                    <input
                                        type="checkbox"
                                        id="includeWeekends"
                                        checked={includeWeekends}
                                        onChange={(e) => setIncludeWeekends(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="includeWeekends" className="ml-2 block text-sm text-slate-700 cursor-pointer select-none">
                                        {t('constraintsModal.includeWeekends')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Time Range Section */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                                {t('constraintsModal.dailySchedule')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraintsModal.firstExamTime')}
                                    </label>
                                    <input
                                        type="time"
                                        value={dailyStartTime}
                                        onChange={(e) => setDailyStartTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraintsModal.lastExamTime')}
                                    </label>
                                    <input
                                        type="time"
                                        value={dailyEndTime}
                                        onChange={(e) => setDailyEndTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        {t('constraintsModal.timeWarning')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Student Constraints Section */}
                        <div className="space-y-5 md:col-span-2">
                            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{t('constraints.studentConstraints', 'Student Constraints')}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraints.maxExamsPerDay', 'Max Exams Per Student Per Day')}
                                    </label>
                                    <select
                                        value={maxExamsPerDay}
                                        onChange={(e) => setMaxExamsPerDay(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4 (No limit)</option>
                                    </select>
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('constraints.minHoursBetweenExams', 'Minimum Hours Between Exams')}
                                    </label>
                                    <select
                                        value={minHoursBetweenExams}
                                        onChange={(e) => setMinHoursBetweenExams(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value={0}>0 (No minimum)</option>
                                        <option value={1}>1 hour</option>
                                        <option value={2}>2 hours</option>
                                        <option value={3}>3 hours</option>
                                        <option value={4}>4 hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        {t('constraintsModal.cancel')}
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                        {t('constraintsModal.generate')}
                    </button>
                </div>
            </div>
        </div>
    );
};