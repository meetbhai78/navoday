import { getNavigationTabs } from './Sidebar';
import { useLanguage } from '../context/LanguageContext';

const SpringboardGrid = ({ role, setTab }) => {
  const { t } = useLanguage();

  const tabs = getNavigationTabs(role, t).filter(tab => tab.id !== 'dashboard');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center space-y-3 shadow-lg active:scale-95 transition-transform"
          >
            <div className="p-4 bg-indigo-600/20 rounded-2xl">
              <Icon size={36} className="text-indigo-400" />
            </div>
            <span className="font-bold text-slate-200 text-sm">{tab.label}</span>
          </button>
        );
      })}

    </div>
  );
};

export default SpringboardGrid;
