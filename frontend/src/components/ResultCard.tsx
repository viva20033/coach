import type { EvaluationResult } from '../types';
import { SKILL_LABELS } from '../types';
import { scoreColor, skillColor, skillLabel } from '../utils/helpers';
import { CheckCircle, XCircle, Lightbulb, Star } from 'lucide-react';

interface Props {
  result: EvaluationResult;
  score: number;
}

export default function ResultCard({ result, score }: Props) {
  return (
    <div className="space-y-4">
      <div className="card text-center">
        <p className="text-sm text-slate-500 mb-1">Итоговый балл</p>
        <p className={`text-5xl font-bold ${scoreColor(score)}`}>{score}</p>
        <p className="text-sm text-slate-600 mt-2">{result.verdict}</p>
      </div>

      {result.strengths.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Сильные стороны</h3>
          </div>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-green-500">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.mistakes.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-danger" />
            <h3 className="font-semibold">Ошибки</h3>
          </div>
          <ul className="space-y-1.5">
            {result.mistakes.map((m, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-danger">•</span> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Рекомендации</h3>
          </div>
          <ul className="space-y-1.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-accent">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.better_response_example && (
        <div className="card bg-primary-light/30 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary-dark">Можно было ответить лучше</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{result.better_response_example}</p>
        </div>
      )}

      {result.skills && (
        <div className="card">
          <h3 className="font-semibold mb-3">Чек-лист навыков</h3>
          <div className="space-y-2">
            {Object.entries(result.skills).map(([key, level]) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-600">
                  {SKILL_LABELS[key as keyof typeof SKILL_LABELS]}
                </span>
                <span className={`badge text-xs ${skillColor(level)}`}>
                  {skillLabel(level)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
