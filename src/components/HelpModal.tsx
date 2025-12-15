import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewMode } from '../types';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: ViewMode;
}

type HelpSection = 'overview' | 'import' | 'generate' | 'views' | 'export';

const HelpImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <div className={`my-6 rounded-lg overflow-hidden border border-slate-200 shadow-md ${className || ''}`}>
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover object-top block"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
        />
    </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, currentView }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<HelpSection>('overview');

    useEffect(() => {
        if (isOpen) {
            switch (currentView) {
                case ViewMode.DASHBOARD:
                    setActiveSection('generate');
                    break;
                case ViewMode.DATA:
                    setActiveSection('import');
                    break;
                case ViewMode.SCHEDULE:
                    setActiveSection('views');
                    break;
                case ViewMode.SETTINGS:
                    setActiveSection('overview');
                    break;
                default:
                    setActiveSection('overview');
                    break;
            }
        }
    }, [isOpen, currentView]);

    if (!isOpen) return null;

    const sections: { id: HelpSection; title: string; icon: React.ReactNode }[] = [
        {
            id: 'overview',
            title: t('help.overview') || 'Overview',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        },
        {
            id: 'import',
            title: t('help.importData') || 'Import Data',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        },
        {
            id: 'generate',
            title: t('help.generateSchedule') || 'Generate Schedule',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
        },
        {
            id: 'views',
            title: t('help.viewSchedule') || 'View Schedule',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        },
        {
            id: 'export',
            title: t('help.exportSchedule') || 'Export',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.welcomeTitle') || 'Welcome to Exam Scheduler'}</h3>
                        <p className="text-slate-600">
                            {t('help.welcomeDesc') || 'This application helps you schedule university exams automatically while respecting constraints like room capacity and student conflicts.'}
                        </p>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <h4 className="font-semibold text-indigo-800 mb-2">{t('help.quickStart') || 'Quick Start Guide'}</h4>
                            <ol className="list-decimal list-inside text-sm text-indigo-700 space-y-1">
                                <li>{t('help.step1') || 'Import your course and classroom data'}</li>
                                <li>{t('help.step2') || 'Import student enrollment lists'}</li>
                                <li>{t('help.step3') || 'Click "Run Generator" on the Dashboard'}</li>
                                <li>{t('help.step4') || 'View and export your schedule'}</li>
                            </ol>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="font-semibold text-amber-800 mb-2">{t('help.constraintsTitle') || 'Scheduling Constraints'}</h4>
                            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                <li>{t('help.constraint1') || 'No student can have two exams at the same time'}</li>
                                <li>{t('help.constraint2') || 'No student can have consecutive exams'}</li>
                                <li>{t('help.constraint3') || 'Maximum 2 exams per student per day'}</li>
                                <li>{t('help.constraint4') || 'Room capacity must fit enrolled students'}</li>
                            </ul>
                        </div>
                    </div>
                );
            case 'import':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.importTitle') || 'Importing Data'}</h3>
                        <p className="text-slate-600">
                            {t('help.importDesc') || 'Navigate to "Data Management" to import your data files.'}
                        </p>
                        <div className="space-y-3">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">{t('help.coursesTab') || 'Courses Tab'}</h4>
                                <p className="text-sm text-slate-600">{t('help.coursesDesc') || 'Import a file containing course codes. The system expects lines starting with course codes followed by underscore.'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">{t('help.classroomsTab') || 'Classrooms Tab'}</h4>
                                <p className="text-sm text-slate-600">{t('help.classroomsDesc') || 'Import a file with classroom names and capacities, separated by semicolons (Name;Capacity).'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">{t('help.studentsTab') || 'Students Tab'}</h4>
                                <p className="text-sm text-slate-600">{t('help.studentsDesc') || 'Import attendance lists showing which students are enrolled in which courses.'}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'generate':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t('help.generateTitle') || 'Generating a Schedule'}</h3>
                            <p className="text-slate-600 mt-2">
                                {t('help.generateDesc') || 'After importing all required data, go to the Dashboard and click the "Run Generator" button.'}
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">{t('help.configOptions') || 'Configuration Options'}</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                <li><strong>{t('help.startDate') || 'Start Date'}:</strong> {t('help.startDateDesc') || 'First day of the exam period'}</li>
                                <li><strong>{t('help.endDate') || 'End Date'}:</strong> {t('help.endDateDesc') || 'Last day of the exam period'}</li>
                                <li><strong>{t('help.dailyHours') || 'Daily Hours'}:</strong> {t('help.dailyHoursDesc') || 'Start and end time for exams each day'}</li>
                                <li><strong>{t('help.weekends') || 'Include Weekends'}:</strong> {t('help.weekendsDesc') || 'Whether to schedule exams on Saturday/Sunday'}</li>
                            </ul>
                        </div>

                        <HelpImage 
                            src={t('help.generateImage')} 
                            alt="Generate Schedule Interface" 
                            className="w-full h-64" 
                        />
                        <p className="text-xs text-center text-slate-400 mt-1">
                            {t('help.generateScreenshotDesc') || 'Algorithm configuration screen'}
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-2">{t('help.noSolution') || 'No Solution Found?'}</h4>
                            <p className="text-sm text-red-700">{t('help.noSolutionDesc') || 'If the system cannot find a valid schedule, try extending the date range, adding more classrooms, or reducing course overlaps.'}</p>
                        </div>
                    </div>
                );
            case 'views':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.viewsTitle') || 'Viewing the Schedule'}</h3>
                        <p className="text-slate-600">
                            {t('help.viewsDesc') || 'The Schedule View offers multiple ways to examine your generated schedule.'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.allView') || 'All View'}</h4>
                                <p className="text-sm text-slate-600">{t('help.allViewDesc') || 'See all exams on a weekly calendar.'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.roomView') || 'By Room'}</h4>
                                <p className="text-sm text-slate-600">{t('help.roomViewDesc') || 'Filter to see one classroom\'s schedule.'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.studentView') || 'By Student'}</h4>
                                <p className="text-sm text-slate-600">{t('help.studentViewDesc') || 'View a specific student\'s exam schedule.'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.courseView') || 'By Course'}</h4>
                                <p className="text-sm text-slate-600">{t('help.courseViewDesc') || 'Find when a specific course exam is scheduled.'}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'export':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.exportTitle') || 'Exporting Your Schedule'}</h3>
                        <p className="text-slate-600">
                            {t('help.exportDesc') || 'Once you have a generated schedule, you can export it for use in other systems.'}
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">{t('help.csvExport') || 'CSV Export'}</h4>
                            <p className="text-sm text-slate-600">{t('help.csvExportDesc') || 'Click the "Export" button in the Schedule View to save your schedule as a CSV file. This format is compatible with Excel and other spreadsheet applications.'}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">{t('help.autoSave') || 'Automatic Saving'}</h4>
                            <p className="text-sm text-green-700">{t('help.autoSaveDesc') || 'Your generated schedule is automatically saved to the database. It will be available when you reopen the application.'}</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex overflow-hidden">
                <div className="w-56 bg-slate-100 border-r border-slate-200 p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <h2 className="text-lg font-bold text-slate-800">{t('help.title') || 'Help'}</h2>
                    </div>
                    <nav className="space-y-1 flex-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {section.icon}
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="flex justify-end p-3 border-b border-slate-200">
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};