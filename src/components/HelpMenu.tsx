import React, { useState } from 'react';
import { ViewMode } from '../types';
import { useTranslation } from 'react-i18next';

interface HelpMenuProps {
    currentView: ViewMode;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ currentView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    const getHelpContent = () => {
        switch (currentView) {
            case ViewMode.DASHBOARD:
                return t('help.dashboard', 'Overview of system status, quick stats on courses, students, and classrooms. You can start the schedule generation from here.');
            case ViewMode.DATA:
                return t('help.dataManagement', 'Manage your academic data here. Use the tabs to switch between Courses, Classrooms, and Students. You can add new entries or import data in bulk.');
            case ViewMode.SCHEDULE:
                return t('help.schedule', 'View the generated exam schedule. You can filter by date or specific constraints to verify the timetable.');
            case ViewMode.SETTINGS:
                return t('help.settings', 'Configure application settings including language and themes.');
            default:
                return t('help.default', 'Welcome to the Exam Scheduler application. Navigate through the sidebar to manage data and generate schedules.');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Help"
                title="Help"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                Help: {currentView}
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-600 leading-relaxed">
                                {getHelpContent()}
                            </p>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
