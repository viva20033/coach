import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, ClipboardCheck, History, User } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/training', icon: Dumbbell, label: 'Тренировка' },
  { to: '/exam', icon: ClipboardCheck, label: 'Зачёт' },
  { to: '/history', icon: History, label: 'История' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="max-w-mobile mx-auto px-2 pb-2">
        <div className="bg-white rounded-[20px] shadow-card flex items-center justify-around py-2 px-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
