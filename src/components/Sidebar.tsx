import React from 'react';
import { ViewMode } from '../types';
import logo from '../assets/logo.png';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  Data: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" /><polyline points="14 2 14 8 20 8" /><path d="M2 15h10" /><path d="m9 18 3-3-3-3" /></svg>,
  Schedule: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>,
};

import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();

  const menuItems = [
    { mode: ViewMode.DASHBOARD, icon: <Icons.Dashboard />, label: t('common.dashboard') },
    { mode: ViewMode.DATA, icon: <Icons.Data />, label: t('common.dataManagement') },
    { mode: ViewMode.SCHEDULE, icon: <Icons.Schedule />, label: t('common.scheduleView') },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SchedulR" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold tracking-tight">SchedulR</span>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3">
        {menuItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => onViewChange(item.mode)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
              ${currentView === item.mode
                ? 'bg-ieu-500 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => onViewChange(ViewMode.SETTINGS)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-700 rounded transition
            ${currentView === ViewMode.SETTINGS
              ? 'bg-ieu-500 text-white border-ieu-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
          <Settings size={16} />
          {t('common.settings')}
        </button>
      </div>
    </div>
  );
};
