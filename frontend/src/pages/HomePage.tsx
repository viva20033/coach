import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, ClipboardCheck, TrendingUp, Target, Award } from 'lucide-react';
import Loading from '../components/Loading';

export default function HomePage() {
  const { user, refresh } = useAuthStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return <Loading />;

  const stats = user.stats;
  const completionRate = stats?.completion_rate ?? 0;

  const statCards = [
    { label: 'Всего тренировок', value: stats?.trainings ?? 0, icon: Dumbbell, color: 'text-primary bg-primary-light' },
    { label: 'Завершено', value: stats?.completion_rate != null ? Math.round((stats.completion_rate / 100) * (stats.trainings || 0)) : 0, icon: Target, color: 'text-green-600 bg-green-50' },
    { label: 'Средний балл', value: stats?.average_score ?? '—', icon: TrendingUp, color: 'text-accent-dark bg-amber-50' },
    { label: 'Выполнение', value: `${completionRate}%`, icon: Award, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">IZO Coach</h1>
          <p className="text-sm text-slate-500">Привет, {user.name.split(' ')[0]}!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card !p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color.split(' ').slice(1).join(' ')}`}>
              <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Link
        to="/training"
        className="card flex items-center gap-4 mb-4 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-lg"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <Dumbbell className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Начать тренировку</h2>
          <p className="text-sm text-slate-500">Выберите сценарий и потренируйтесь</p>
        </div>
      </Link>

      <Link
        to="/exam"
        className="card flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-lg"
      >
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Пройти зачёт</h2>
          <p className="text-sm text-slate-500">5 случайных кейсов подряд</p>
        </div>
      </Link>
    </div>
  );
}
