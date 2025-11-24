import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-600" />
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
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="mr-2">🇺🇸</span> {t('settings.english')}
                                </button>
                                <button
                                    onClick={() => changeLanguage('tr')}
                                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${i18n.language === 'tr'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
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
        </div>
    );
};
