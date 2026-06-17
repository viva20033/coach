import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Scenario, Difficulty } from '../types';
import { CATEGORIES } from '../types';
import Loading from '../components/Loading';
import Empty from '../components/Empty';
import ErrorState from '../components/ErrorState';
import DifficultyBadge from '../components/DifficultyBadge';
import { Search, Star, MessageCircle, AlertTriangle, Clock, DollarSign, Palette, Wrench, FileText, Users } from 'lucide-react';
import { getFavorites, getCompletedScenarios, toggleFavorite, isFavorite } from '../utils/helpers';

const categoryIcons: Record<string, typeof Search> = {
  'Продажи': Users,
  'Конфликт': AlertTriangle,
  'Производство': Wrench,
  'Дизайн': Palette,
  'Монтаж': Wrench,
  'Тендеры': FileText,
  'Сроки': Clock,
  'Цена': DollarSign,
};

export default function TrainingPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [favorites, setFavorites] = useState<number[]>(getFavorites());
  const completed = getCompletedScenarios();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      if (category) params.category = category;
      if (status && status !== 'favorite') params.status = status;
      const data = await api.getScenarios(params);
      setScenarios(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [difficulty, category, status]);

  const filtered = useMemo(() => {
    let list = scenarios;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    if (status === 'favorite') {
      list = list.filter((s) => favorites.includes(s.id));
    }
    if (status === 'completed') {
      list = list.filter((s) => completed.includes(s.id));
    }
    if (status === 'new') {
      list = list.filter((s) => !completed.includes(s.id));
    }
    return list;
  }, [scenarios, search, status, favorites, completed]);

  const handleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(toggleFavorite(id));
  };

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">Тренировка</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск сценариев..."
          className="input-field pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field !py-2 !text-xs shrink-0 w-auto">
          <option value="">Сложность</option>
          <option value="easy">Лёгкий</option>
          <option value="medium">Средний</option>
          <option value="hard">Сложный</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field !py-2 !text-xs shrink-0 w-auto">
          <option value="">Категория</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field !py-2 !text-xs shrink-0 w-auto">
          <option value="">Статус</option>
          <option value="new">Новый</option>
          <option value="completed">Пройден</option>
          <option value="favorite">Избранный</option>
        </select>
      </div>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <Empty title="Сценарии не найдены" description="Попробуйте изменить фильтры" />
      )}

      <div className="space-y-3 pb-4">
        {filtered.map((s) => {
          const Icon = categoryIcons[s.category] || MessageCircle;
          return (
            <div key={s.id} className="card relative">
              <button
                onClick={(e) => handleFavorite(s.id, e)}
                className="absolute top-4 right-4 p-1"
              >
                <Star
                  className={`w-5 h-5 ${isFavorite(s.id) ? 'fill-accent text-accent' : 'text-slate-300'}`}
                />
              </button>
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <DifficultyBadge difficulty={s.difficulty as Difficulty} />
                    <span className="badge bg-slate-100 text-slate-600">{s.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/training/${s.id}/chat`)}
                className="btn-primary w-full mt-4 text-sm py-3"
              >
                Начать диалог
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
