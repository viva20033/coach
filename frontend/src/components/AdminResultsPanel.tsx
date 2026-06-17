import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AdminResultDetail, AdminResultItem, AdminUser, Scenario, EvaluationResult } from '../types';
import ResultCard from './ResultCard';
import DifficultyBadge from './DifficultyBadge';
import Loading from './Loading';
import Empty from './Empty';
import { formatDate, scoreColor } from '../utils/helpers';
import type { Difficulty } from '../types';
import { Download, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface Props {
  users: AdminUser[];
  scenarios: Scenario[];
}

function ResultRow({
  item,
  expanded,
  onToggle,
}: {
  item: AdminResultItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detail, setDetail] = useState<AdminResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setDetail(null);
      return;
    }
    if (detail?.session_id === item.session_id) return;

    setLoadingDetail(true);
    api
      .getAdminResultDetail(item.session_id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [expanded, item.session_id, detail?.session_id]);

  const result = item.result_json as EvaluationResult | null;
  const typeLabel = item.type === 'exam' ? 'Зачёт' : 'Тренировка';

  return (
    <div className="card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 active:bg-slate-50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800">{item.user_name}</p>
            <span className="badge bg-slate-100 text-slate-600">{typeLabel}</span>
            {item.scenario_difficulty && (
              <DifficultyBadge difficulty={item.scenario_difficulty as Difficulty} />
            )}
          </div>
          <p className="text-sm text-slate-700 mt-1">{item.scenario_title}</p>
          <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)}</p>
          {result?.verdict && (
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{result.verdict}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.score != null && (
            <span className={`text-xl font-bold ${scoreColor(item.score)}`}>{item.score}</span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50/50">
          {loadingDetail && <Loading text="Загрузка диалога..." />}
          {!loadingDetail && detail && (
            <>
              <div className="card mb-3 !p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Диалог</h4>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {detail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-sm rounded-xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary-light text-slate-700 ml-3'
                          : 'bg-white text-slate-600 mr-3 shadow-soft'
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
              {detail.result_json && detail.score != null ? (
                <ResultCard result={detail.result_json as EvaluationResult} score={detail.score} />
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Анализ недоступен</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminResultsPanel({ users, scenarios }: Props) {
  const [results, setResults] = useState<AdminResultItem[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [scenarioId, setScenarioId] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (userId) params.user_id = userId;
      if (scenarioId) params.scenario_id = scenarioId;
      const res = await api.getAdminResults(params);
      setResults(res.items);
      setAvgScore(res.average_score);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId, scenarioId]);

  const exportCsv = async () => {
    const params: Record<string, string> = {};
    if (userId) params.user_id = userId;
    if (scenarioId) params.scenario_id = scenarioId;
    const csv = await api.exportResultsCsv(params);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'izo-coach-results.csv';
    a.click();
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-danger mb-3">{error}</p>
        <button onClick={load} className="btn-primary text-sm py-2 px-4">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-slate-500">Завершённых попыток</p>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-slate-500 mt-1">
              Средний балл: <span className="font-semibold">{avgScore ?? '—'}</span>
            </p>
          </div>
          <button onClick={exportCsv} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field !py-2 !text-xs"
          >
            <option value="">Все участники</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="input-field !py-2 !text-xs"
          >
            <option value="">Все сценарии</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading />}
      {!loading && results.length === 0 && (
        <Empty title="Нет результатов" description="Завершённые тренировки и зачёты появятся здесь" />
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <ResultRow
            key={r.session_id}
            item={r}
            expanded={expandedId === r.session_id}
            onToggle={() =>
              setExpandedId(expandedId === r.session_id ? null : r.session_id)
            }
          />
        ))}
      </div>
    </div>
  );
}
