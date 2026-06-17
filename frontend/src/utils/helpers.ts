import type { Difficulty, SkillLevel } from '../types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function difficultyColor(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
  }
}

export function skillColor(level: SkillLevel): string {
  switch (level) {
    case 'good':
      return 'text-green-600 bg-green-50';
    case 'medium':
      return 'text-amber-600 bg-amber-50';
    case 'bad':
      return 'text-red-600 bg-red-50';
  }
}

export function skillLabel(level: SkillLevel): string {
  switch (level) {
    case 'good':
      return 'Хорошо';
    case 'medium':
      return 'Средне';
    case 'bad':
      return 'Плохо';
  }
}

export function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-amber-600';
  return 'text-red-600';
}

const FAVORITES_KEY = 'izo_favorites';

export function getFavorites(): number[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavorite(id: number): number[] {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs;
}

export function isFavorite(id: number): boolean {
  return getFavorites().includes(id);
}

export function getCompletedScenarios(): number[] {
  try {
    return JSON.parse(localStorage.getItem('izo_completed') || '[]');
  } catch {
    return [];
  }
}

export function markCompleted(id: number): void {
  const completed = getCompletedScenarios();
  if (!completed.includes(id)) {
    completed.push(id);
    localStorage.setItem('izo_completed', JSON.stringify(completed));
  }
}
