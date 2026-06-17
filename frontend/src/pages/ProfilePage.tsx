import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Loading from '../components/Loading';
import { formatDate } from '../utils/helpers';
import { Settings, LogOut, Award, Dumbbell, ClipboardCheck, TrendingUp } from 'lucide-react';

const roleLabels: Record<string, string> = {
  manager: 'Менеджер',
  mentor: 'Наставник',
  admin: 'Администратор',
};

export default function ProfilePage() {
  const { user, refresh, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return <Loading />;

  const stats = user.stats;
  const initial = user.name.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-6">Профиль</h1>

      <div className="card flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
          {initial}
        </div>
        <div>
          <h2 className="font-bold text-lg">{user.name}</h2>
          {user.username && (
            <p className="text-sm text-slate-500">@{user.username}</p>
          )}
          <span className="badge bg-primary-light text-primary-dark mt-1">
            {roleLabels[user.role] || user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Тренировок', value: stats?.trainings ?? 0, icon: Dumbbell },
          { label: 'Зачётов', value: stats?.exams ?? 0, icon: ClipboardCheck },
          { label: 'Средний балл', value: stats?.average_score ?? '—', icon: TrendingUp },
          { label: 'Лучший балл', value: stats?.best_score ?? '—', icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card !p-4 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3 mb-4">
        <h3 className="font-semibold">Информация</h3>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Telegram ID</span>
          <span className="text-slate-700">{user.telegram_id || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Роль</span>
          <span className="text-slate-700">{roleLabels[user.role]}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Дата регистрации</span>
          <span className="text-slate-700">{formatDate(user.created_at)}</span>
        </div>
      </div>

      {user.role === 'admin' && (
        <Link to="/admin" className="card flex items-center gap-3 mb-3 active:scale-[0.99]">
          <Settings className="w-5 h-5 text-primary" />
          <span className="font-semibold">Админ-панель</span>
        </Link>
      )}

      <button onClick={handleLogout} className="btn-secondary w-full flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" />
        Выйти
      </button>
    </div>
  );
}
