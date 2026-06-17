import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Session, EvaluationResult } from '../types';
import ChatView from '../components/ChatView';
import ResultCard from '../components/ResultCard';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { ArrowLeft } from 'lucide-react';
import { markCompleted } from '../utils/helpers';

export default function TrainingChatPage() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ score: number; result: EvaluationResult } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const start = async () => {
      try {
        const s = await api.startTraining(Number(scenarioId));
        setSession(s);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [scenarioId]);

  const handleSend = async (content: string) => {
    if (!session) return;
    setSending(true);
    setError('');
    try {
      const updated = await api.sendTrainingMessage(session.id, content);
      setSession(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    setFinishing(true);
    try {
      const res = await api.finishTraining(session.id);
      setResult(res);
      markCompleted(session.scenario_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinishing(false);
    }
  };

  if (loading || finishing) return <Loading text={finishing ? 'Оцениваем диалог...' : 'Загрузка...'} />;
  if (error && !session) return <ErrorState message={error} onRetry={() => navigate('/training')} />;

  if (result) {
    return (
      <div className="px-5 pt-4 pb-6">
        <h1 className="text-xl font-bold mb-4 text-center">Результат тренировки</h1>
        <ResultCard result={result.result} score={result.score} />
        <button onClick={() => navigate('/training')} className="btn-primary w-full mt-6">
          К сценариям
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary w-full mt-2">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/training')} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{session?.scenario?.client_role}</p>
          <p className="text-xs text-primary">Тренировка</p>
        </div>
        <button onClick={handleFinish} className="text-sm font-medium text-danger">
          Завершить
        </button>
      </header>

      {session && (
        <ChatView
          messages={session.messages}
          onSend={handleSend}
          onFinish={handleFinish}
          sending={sending}
          error={error}
        />
      )}
    </div>
  );
}
