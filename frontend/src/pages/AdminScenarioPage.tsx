import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORIES } from '../types';
import Loading from '../components/Loading';
import { ArrowLeft } from 'lucide-react';

const emptyScenario: {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  client_role: string;
  initial_message: string;
  ai_behavior_prompt: string;
  evaluation_criteria: string;
  is_active: boolean;
} = {
  title: '',
  description: '',
  category: 'Продажи',
  difficulty: 'medium',
  client_role: '',
  initial_message: '',
  ai_behavior_prompt: '',
  evaluation_criteria: '',
  is_active: true,
};

export default function AdminScenarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = useState(emptyScenario);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.getAdminScenarios().then((list) => {
        const s = list.find((x) => x.id === Number(id));
        if (s) {
          setForm({
            title: s.title,
            description: s.description,
            category: s.category,
            difficulty: s.difficulty as 'easy' | 'medium' | 'hard',
            client_role: s.client_role,
            initial_message: s.initial_message,
            ai_behavior_prompt: s.ai_behavior_prompt || '',
            evaluation_criteria: s.evaluation_criteria || '',
            is_active: s.is_active,
          });
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.createScenario(form);
      } else {
        await api.updateScenario(Number(id), form);
      }
      navigate('/admin');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (loading) return <Loading />;

  return (
    <div className="px-5 pt-4 pb-6">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin')} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{isNew ? 'Новый сценарий' : 'Редактирование'}</h1>
      </header>

      <div className="space-y-3">
        {[
          { key: 'title', label: 'Название', type: 'text' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'client_role', label: 'Роль клиента', type: 'text' },
          { key: 'initial_message', label: 'Первое сообщение', type: 'textarea' },
          { key: 'ai_behavior_prompt', label: 'Промт поведения ИИ', type: 'textarea' },
          { key: 'evaluation_criteria', label: 'Критерии оценки', type: 'textarea' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-sm font-medium text-slate-600 mb-1 block">{label}</label>
            {type === 'textarea' ? (
              <textarea
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                className="input-field min-h-[80px]"
                rows={3}
              />
            ) : (
              <input
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key, e.target.value)}
                className="input-field"
              />
            )}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Категория</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Сложность</label>
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className="input-field">
              <option value="easy">Лёгкий</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set('is_active', e.target.checked)}
            className="rounded"
          />
          Активен
        </label>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
