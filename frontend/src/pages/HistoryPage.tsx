import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { HistoryItem } from '../types';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorState from '../components/ErrorState';
import DifficultyBadge from '../components/DifficultyBadge';
import { formatDate, scoreColor } from '../utils/helpers';
import type { Difficulty } from '../types';
import { Dumbbell, ClipboardCheck, Clock } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setItems(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items.length === 0) return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">История</h1>
      <Empty title="История пуста" description="Пройдите тренировку или зачёт" />
    </div>
  );

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">История</h1>
      <div className="space-y-3 pb-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/history/${item.id}`)}
            className="card w-full text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.type === 'exam' ? (
                    <ClipboardCheck className="w-4 h-4 text-accent shrink-0" />
                  ) : (
                    <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <h3 className="font-semibold text-sm truncate">{item.scenario_title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.created_at)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <DifficultyBadge difficulty={item.scenario_difficulty as Difficulty} />
                  <span className={`badge text-xs ${
                    item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'completed' ? 'Завершено' : 'В процессе'}
                  </span>
                  <span className="badge bg-slate-100 text-slate-600">
                    {item.type === 'exam' ? 'Зачёт' : 'Тренировка'}
                  </span>
                </div>
              </div>
              {item.score != null && (
                <span className={`text-xl font-bold ${scoreColor(item.score)}`}>
                  {item.score}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
