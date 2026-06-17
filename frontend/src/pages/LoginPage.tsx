import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('Менеджер ИЗОСТУДИИ');
  const [role, setRole] = useState('manager');

  const handleLogin = async () => {
    await login(name, role);
    const user = useAuthStore.getState().user;
    if (user) navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-card bg-primary mx-auto flex items-center justify-center mb-4 shadow-card">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">IZO Coach</h1>
          <p className="text-sm text-slate-500 mt-1">Тренажёр менеджера ИЗОСТУДИИ</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Роль (dev)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
            >
              <option value="manager">Менеджер</option>
              <option value="mentor">Наставник</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button onClick={handleLogin} disabled={loading || !name.trim()} className="btn-primary w-full">
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Dev-режим. В продакшене — Telegram Mini App.
          </p>
        </div>
      </div>
    </div>
  );
}
