import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { HistoryDetail } from '../types';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import ResultCard from '../components/ResultCard';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function HistoryDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getHistoryDetail(Number(sessionId));
        setDetail(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) return <Loading />;
  if (error || !detail) return <ErrorState message={error || 'Не найдено'} onRetry={() => navigate('/history')} />;

  return (
    <div className="px-5 pt-4 pb-6">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/history')} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-lg">{detail.scenario_title}</h1>
          <p className="text-xs text-slate-500">{formatDate(detail.created_at)}</p>
        </div>
      </header>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Диалог</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {detail.messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm rounded-xl px-3 py-2 ${
                msg.role === 'user' ? 'bg-primary-light text-slate-700 ml-4' : 'bg-slate-50 text-slate-600 mr-4'
              }`}
            >
              <span className="text-[10px] font-medium text-slate-400 block mb-0.5">
                {msg.role === 'user' ? 'Менеджер' : 'Клиент'}
              </span>
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      {detail.result_json && detail.score != null && (
        <ResultCard result={detail.result_json} score={detail.score} />
      )}
    </div>
  );
}
