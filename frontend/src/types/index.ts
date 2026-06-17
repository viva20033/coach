export type UserRole = 'manager' | 'mentor' | 'admin';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SkillLevel = 'good' | 'medium' | 'bad';

export interface User {
  id: number;
  name: string;
  telegram_id: string | null;
  username: string | null;
  role: UserRole;
  created_at: string;
  stats?: UserStats;
}

export interface UserStats {
  trainings: number;
  exams: number;
  average_score: number | null;
  best_score: number | null;
  completion_rate: number | null;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  client_role: string;
  initial_message: string;
  is_active: boolean;
  created_at: string;
  ai_behavior_prompt?: string;
  evaluation_criteria?: string | null;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface EvaluationSkills {
  tone: SkillLevel;
  needs_discovery: SkillLevel;
  questions: SkillLevel;
  objection_handling: SkillLevel;
  agreements: SkillLevel;
  next_step: SkillLevel;
  production_awareness: SkillLevel;
  no_dangerous_promises: SkillLevel;
}

export interface EvaluationResult {
  score: number;
  verdict: string;
  strengths: string[];
  mistakes: string[];
  recommendations: string[];
  better_response_example: string;
  skills: EvaluationSkills;
}

export interface Session {
  id: number;
  user_id: number;
  scenario_id: number;
  type: 'training' | 'exam';
  status: 'in_progress' | 'completed';
  score: number | null;
  result_json: EvaluationResult | null;
  created_at: string;
  completed_at: string | null;
  scenario?: Scenario;
  messages: Message[];
}

export interface HistoryItem {
  id: number;
  scenario_title: string;
  scenario_difficulty: Difficulty;
  type: 'training' | 'exam';
  status: string;
  score: number | null;
  created_at: string;
  completed_at: string | null;
  exam_id: number | null;
}

export interface HistoryDetail extends Session {
  scenario_title: string;
  scenario_difficulty: Difficulty;
  scenario_category: string;
}

export interface ExamCaseResult {
  case_number: number;
  scenario_title: string;
  score: number;
  verdict?: string;
}

export interface ExamResult {
  exam_id: number;
  average_score: number;
  passed: boolean;
  result: {
    average_score: number;
    passed: boolean;
    summary: string;
    recommendations: string[];
    weak_areas: string[];
    cases: Array<{ scenario: string; score: number; verdict?: string }>;
  };
  cases: ExamCaseResult[];
}

export interface AdminUser {
  id: number;
  name: string;
  telegram_id: string | null;
  username: string | null;
  role: UserRole;
  created_at: string;
  trainings_count: number;
  exams_count: number;
  average_score: number | null;
}

export interface AdminResultItem {
  session_id: number;
  user_id: number;
  user_name: string;
  scenario_id: number;
  scenario_title: string;
  scenario_difficulty: string;
  scenario_category: string;
  type: string;
  score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  result_json: EvaluationResult | null;
}

export interface AdminResultDetail extends AdminResultItem {
  messages: Message[];
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

export const CATEGORIES = [
  'Продажи',
  'Конфликт',
  'Производство',
  'Дизайн',
  'Монтаж',
  'Тендеры',
  'Сроки',
  'Цена',
] as const;

export const SKILL_LABELS: Record<keyof EvaluationSkills, string> = {
  tone: 'Уважительный тон',
  needs_discovery: 'Выявление потребности',
  questions: 'Уточняющие вопросы',
  objection_handling: 'Работа с возражением',
  agreements: 'Фиксация договорённостей',
  next_step: 'Следующий шаг',
  production_awareness: 'Знание производства',
  no_dangerous_promises: 'Без опасных обещаний',
};
