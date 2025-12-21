import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Database, FolderOpen } from 'lucide-react';

declare global {
    interface Window {
        api: {
            getDbPath: () => Promise<string>;
            openDbLocation: () => Promise<void>;
            [key: string]: any;
        };
    }
}

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [dbPath, setDbPath] = useState<string>('');

    useEffect(() => {
        const fetchDbPath = async () => {
            try {
                const path = await window.api.getDbPath();
                setDbPath(path);
            } catch (error) {
                console.error('Failed to get DB path:', error);
            }
        };
        fetchDbPath();
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const openFileLocation = async () => {
        try {
            await window.api.openDbLocation();
        } catch (error) {
            console.error('Failed to open file location:', error);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Language Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-ieu-500" />
                        {t('settings.language')}
                    </h2>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">
                                {t('settings.selectLanguage')}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${i18n.language === 'en'
                                        ? 'bg-ieu-50 border-ieu-200 text-ieu-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="mr-2">🇺🇸</span> {t('settings.english')}
                                </button>
                                <button
                                    onClick={() => changeLanguage('tr')}
                                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${i18n.language === 'tr'
                                        ? 'bg-ieu-50 border-ieu-200 text-ieu-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="mr-2">🇹🇷</span> {t('settings.turkish')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-ieu-500" />
                        {t('settings.storage')}
                    </h2>
                </div>

                <div className="p-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            {t('settings.databaseLocation')}
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            {t('settings.databaseLocationDesc')}
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 font-mono overflow-x-auto">
                                {dbPath || '...'}
                            </code>
                            <button
                                onClick={openFileLocation}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                title={t('settings.openLocation')}
                            >
                                <FolderOpen className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
