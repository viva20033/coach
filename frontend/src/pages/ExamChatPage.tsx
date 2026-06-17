import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import type { Session } from '../types';
import ChatView from '../components/ChatView';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { ArrowLeft } from 'lucide-react';

export default function ExamChatPage() {
  const { examId, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const caseNumber = (location.state as { caseNumber?: number })?.caseNumber ?? 1;
  const totalCases = (location.state as { totalCases?: number })?.totalCases ?? 5;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const s = await api.getTrainingSession(Number(sessionId));
        setSession(s);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, sessionId]);

  const handleSend = async (content: string) => {
    if (!session) return;
    setSending(true);
    setError('');
    try {
      const updated = await api.sendExamMessage(Number(examId), session.id, content);
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
      await api.finishExamCase(Number(examId), session.id);

      const exam = await api.getExam(Number(examId));
      const nextCase = exam.current_case;

      if (nextCase && caseNumber < totalCases) {
        navigate(`/exam/${examId}/case/${nextCase.id}`, {
          state: { caseNumber: caseNumber + 1, totalCases },
          replace: true,
        });
        setSession(nextCase);
        setFinishing(false);
      } else {
        const finalResult = await api.finishExam(Number(examId));
        navigate(`/exam/${examId}/result`, { state: { result: finalResult } });
      }
    } catch (e) {
      setError((e as Error).message);
      setFinishing(false);
    }
  };

  if (loading || finishing) return <Loading text={finishing ? 'Оцениваем кейс...' : 'Загрузка...'} />;
  if (error && !session) return <ErrorState message={error} />;

  return (
    <div>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/exam')} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Кейс {caseNumber} из {totalCases}</p>
          <p className="text-xs text-accent-dark">Зачёт</p>
        </div>
        <button onClick={handleFinish} className="text-sm font-medium text-danger">
          Завершить
        </button>
      </header>

      {session?.scenario && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-slate-700">{session.scenario.description}</p>
        </div>
      )}

      {session && (
        <ChatView
          messages={session.messages}
          onSend={handleSend}
          onFinish={handleFinish}
          sending={sending}
          showHint={false}
          error={error}
        />
      )}
    </div>
  );
}
