import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewMode } from '../types';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: ViewMode;
}

// Menüdeki ana başlıklar
type HelpSection = 'overview' | 'import' | 'generate' | 'views' | 'export';

// Import sekmesinin alt başlıkları
type ImportTab = 'courses' | 'classrooms' | 'students' | 'attendance';

// --- GÖRSEL BİLEŞENİ ---
const HelpImage = ({ src, alt }: { src: string; alt: string }) => {
    return (
        <div className="my-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            <img
                src={src}
                alt={alt}
                className="w-full h-auto object-cover block"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
            />
        </div>
    );
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, currentView }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<HelpSection>('overview');
    const [activeImportTab, setActiveImportTab] = useState<ImportTab>('courses');

    // Modal açıldığında ilgili sayfayı getir
    useEffect(() => {
        if (isOpen) {
            switch (currentView) {
                case ViewMode.DASHBOARD: setActiveSection('generate'); break;
                case ViewMode.DATA: setActiveSection('import'); break;
                case ViewMode.SCHEDULE: setActiveSection('views'); break;
                case ViewMode.SETTINGS: setActiveSection('overview'); break;
                default: setActiveSection('overview');
            }
        }
    }, [isOpen, currentView]);

    if (!isOpen) return null;

    // Sol Menü İkonları ve Başlıkları
    const sections: { id: HelpSection; title: string; icon: React.ReactNode }[] = [
        {
            id: 'overview',
            title: t('help.overview'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        },
        {
            id: 'import',
            title: t('help.importData'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        },
        {
            id: 'generate',
            title: t('help.generateSchedule'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
        },
        {
            id: 'views',
            title: t('help.viewSchedule'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        },
        {
            id: 'export',
            title: t('help.exportSchedule'),
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.welcomeTitle')}</h3>
                        <p className="text-slate-600">{t('help.welcomeDesc')}</p>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <h4 className="font-semibold text-indigo-800 mb-2">{t('help.quickStart')}</h4>
                            <ol className="list-decimal list-inside text-sm text-indigo-700 space-y-1">
                                <li>{t('help.step1')}</li>
                                <li>{t('help.step2')}</li>
                                <li>{t('help.step3')}</li>
                                <li>{t('help.step4')}</li>
                            </ol>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="font-semibold text-amber-800 mb-2">{t('help.constraintsTitle')}</h4>
                            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                <li>{t('help.constraint1')}</li>
                                <li>{t('help.constraint2')}</li>
                                <li>{t('help.constraint3')}</li>
                                <li>{t('help.constraint4')}</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'import':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.importTitle')}</h3>
                        <p className="text-slate-600 mb-4">{t('help.importDesc')}</p>

                        {/* YENİ RESİMLİ ALT SEKMELER */}
                        <div className="flex gap-2 border-b border-slate-200 mb-4 overflow-x-auto">
                            {(['courses', 'classrooms', 'students', 'attendance'] as ImportTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveImportTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                        activeImportTab === tab
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {t(`dataInput.${tab}`)}
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {activeImportTab === 'courses' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-800">{t('help.coursesTab')}</h4>
                                    <p className="text-sm text-slate-600">{t('help.coursesDesc')}</p>
                                    <HelpImage src={t('help.importCoursesImage')} alt="Courses Import" />
                                </div>
                            )}

                            {activeImportTab === 'classrooms' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-800">{t('help.classroomsTab')}</h4>
                                    <p className="text-sm text-slate-600">{t('help.classroomsDesc')}</p>
                                    <HelpImage src={t('help.importClassroomsImage')} alt="Classrooms Import" />
                                </div>
                            )}

                            {activeImportTab === 'students' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-800">{t('help.studentsTab')}</h4>
                                    <p className="text-sm text-slate-600">{t('help.studentsDesc')}</p>
                                    
                                    <HelpImage src={t('help.importStudentsImage')} alt="Students Import Step 1" />
                                    
                                    <p className="text-sm text-slate-600 mt-4 font-medium">Step 2:</p>
                                    <HelpImage src={t('help.importStudentsImage2')} alt="Students Import Step 2" />
                                </div>
                            )}

                            {activeImportTab === 'attendance' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-800">Attendance List</h4>
                                    <p className="text-sm text-slate-600">
                                        Import the connection between students and courses. 
                                        <strong> Note:</strong> Students and Courses must be imported first.
                                    </p>

                                    {/* 1. Resim */}
                                    <HelpImage src={t('help.importAttendanceImage')} alt="Attendance Import Step 1" />

                                    {/* Araya "Step 2" yazısı */}
                                    <p className="text-sm text-slate-600 mt-4 font-medium">Step 2:</p>

                                    {/* 2. Resim (Yeni Eklenen) */}
                                    <HelpImage src={t('help.importAttendanceImage2')} alt="Attendance Import Step 2" />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'generate':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t('help.generateTitle')}</h3>
                            <p className="text-slate-600 mt-2">{t('help.generateDesc')}</p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">{t('help.configOptions')}</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                                <li><strong>{t('help.startDate')}:</strong> {t('help.startDateDesc')}</li>
                                <li><strong>{t('help.endDate')}:</strong> {t('help.endDateDesc')}</li>
                                <li><strong>{t('help.dailyHours')}:</strong> {t('help.dailyHoursDesc')}</li>
                                <li><strong>{t('help.weekends')}:</strong> {t('help.weekendsDesc')}</li>
                            </ul>
                        </div>

                        {/* Varsa Generate Resmi */}
                        <HelpImage src={t('help.generateImage')} alt="Generate Schedule Interface" />

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-2">{t('help.noSolution')}</h4>
                            <p className="text-sm text-red-700">{t('help.noSolutionDesc')}</p>
                        </div>
                    </div>
                );

            case 'views':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.viewsTitle')}</h3>
                        <p className="text-slate-600">{t('help.viewsDesc')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.allView')}</h4>
                                <p className="text-sm text-slate-600">{t('help.allViewDesc')}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.roomView')}</h4>
                                <p className="text-sm text-slate-600">{t('help.roomViewDesc')}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.studentView')}</h4>
                                <p className="text-sm text-slate-600">{t('help.studentViewDesc')}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-800 mb-1">{t('help.courseView')}</h4>
                                <p className="text-sm text-slate-600">{t('help.courseViewDesc')}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'export':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800">{t('help.exportTitle')}</h3>
                        <p className="text-slate-600">{t('help.exportDesc')}</p>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">{t('help.csvExport')}</h4>
                            <p className="text-sm text-slate-600">{t('help.csvExportDesc')}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-2">{t('help.autoSave')}</h4>
                            <p className="text-sm text-green-700">{t('help.autoSaveDesc')}</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden">
                {/* SOL MENÜ */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col shrink-0">
                    <div className="flex items-center gap-2 mb-6 px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <h2 className="text-lg font-bold text-slate-800">{t('help.title')}</h2>
                    </div>
                    <nav className="space-y-1 flex-1 overflow-y-auto">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    activeSection === section.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                {section.icon}
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* SAĞ İÇERİK */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800 capitalize">
                            {sections.find(s => s.id === activeSection)?.title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};