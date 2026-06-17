import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import type { AdminUser, Scenario } from '../types';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import AdminResultsPanel from '../components/AdminResultsPanel';
import { ArrowLeft, Users, FileText, BarChart3, Plus, Trash2 } from 'lucide-react';

type Tab = 'users' | 'scenarios' | 'results';

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'users') setUsers(await api.getAdminUsers());
      if (tab === 'scenarios') setScenarios(await api.getAdminScenarios());
      if (tab === 'results') {
        const [u, s] = await Promise.all([api.getAdminUsers(), api.getAdminScenarios()]);
        setUsers(u);
        setScenarios(s);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const updateRole = async (userId: number, role: string) => {
    await api.updateUserRole(userId, role);
    load();
  };

  const deleteScenario = async (id: number) => {
    if (!confirm('Удалить сценарий?')) return;
    await api.deleteScenario(id);
    load();
  };

  const toggleActive = async (s: Scenario) => {
    await api.updateScenario(s.id, { is_active: !s.is_active });
    load();
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Пользователи', icon: Users },
    { id: 'scenarios' as Tab, label: 'Сценарии', icon: FileText },
    { id: 'results' as Tab, label: 'Результаты', icon: BarChart3 },
  ];

  return (
    <div className="px-5 pt-4 pb-6">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/profile')} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Админ-панель</h1>
      </header>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-button text-sm font-medium shrink-0 ${
              tab === id ? 'bg-primary text-white' : 'bg-white text-slate-600 shadow-soft'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading && tab !== 'results' && <Loading />}
      {error && tab !== 'results' && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && tab === 'users' && (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{u.name}</h3>
                  <p className="text-xs text-slate-500">TG: {u.telegram_id || '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Тренировок: {u.trainings_count} · Зачётов: {u.exams_count} · Ср. балл: {u.average_score ?? '—'}
                  </p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  className="input-field !py-1.5 !text-xs w-auto"
                >
                  <option value="manager">Менеджер</option>
                  <option value="mentor">Наставник</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && tab === 'scenarios' && (
        <div className="space-y-3">
          <button
            onClick={() => navigate('/admin/scenario/new')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Создать сценарий
          </button>
          {scenarios.map((s) => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{s.category} · {s.difficulty}</p>
                  <span className={`badge mt-2 ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.is_active ? 'Активен' : 'Отключён'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/admin/scenario/${s.id}`)} className="text-xs text-primary font-medium">
                    Изменить
                  </button>
                  <button onClick={() => toggleActive(s)} className="text-xs text-slate-500">
                    {s.is_active ? 'Выкл' : 'Вкл'}
                  </button>
                  <button onClick={() => deleteScenario(s.id)} className="text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'results' && (loading ? <Loading /> : !error && (
        <AdminResultsPanel users={users} scenarios={scenarios} />
      ))}
    </div>
  );
}
