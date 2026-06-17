import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Loading from '../components/Loading';
import { ClipboardCheck } from 'lucide-react';

export default function ExamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.startExam();
      navigate(`/exam/${res.exam_id}/case/${res.session.id}`, {
        state: { caseNumber: res.case_number, totalCases: res.total_cases },
      });
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Подготавливаем зачёт..." />;

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">Зачёт</h1>

      <div className="card text-center py-8">
        <div className="w-20 h-20 rounded-card bg-accent mx-auto flex items-center justify-center mb-4">
          <ClipboardCheck className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-lg font-bold mb-2">Проверка навыков</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Вы пройдёте 5 случайных кейсов подряд. Подсказки отключены. Зачёт сдан при среднем балле 7 и выше.
        </p>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <button onClick={startExam} className="btn-primary w-full">
          Начать зачёт
        </button>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold mb-2">Правила</h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>• 5 случайных сценариев</li>
          <li>• Без подсказок и инструкций</li>
          <li>• Минимум 2 сообщения в каждом кейсе</li>
          <li>• Средний балл ≥ 7 — зачёт сдан</li>
        </ul>
      </div>
    </div>
  );
}
