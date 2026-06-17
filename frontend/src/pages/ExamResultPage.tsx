import { useLocation, useNavigate } from 'react-router-dom';
import type { ExamResult } from '../types';
import { scoreColor } from '../utils/helpers';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ExamResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.result as ExamResult | undefined;

  if (!data) {
    return (
      <div className="px-5 pt-6 text-center">
        <p className="text-slate-500 mb-4">Результат не найден</p>
        <button onClick={() => navigate('/exam')} className="btn-primary">К зачёту</button>
      </div>
    );
  }

  const { average_score, passed, result, cases } = data;

  return (
    <div className="px-5 pt-6 pb-6">
      <h1 className="text-xl font-bold text-center mb-4">Результат зачёта</h1>

      <div className="card text-center mb-4">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 ${
          passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {passed ? 'Зачёт сдан' : 'Зачёт не сдан'}
        </div>
        <p className="text-sm text-slate-500">Средний балл</p>
        <p className={`text-5xl font-bold ${scoreColor(average_score)}`}>{average_score}</p>
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Баллы по кейсам</h3>
        <div className="space-y-2">
          {cases.map((c) => (
            <div key={c.case_number} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600 truncate flex-1 mr-2">
                {c.case_number}. {c.scenario_title}
              </span>
              <span className={`font-semibold ${scoreColor(c.score)}`}>{c.score}</span>
            </div>
          ))}
        </div>
      </div>

      {result.summary && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-2">Общий вывод</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-2">Рекомендации</h3>
          <ul className="space-y-1.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-slate-600">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => navigate('/')} className="btn-primary w-full mt-2">
        На главную
      </button>
    </div>
  );
}
