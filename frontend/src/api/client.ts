const API_BASE = '/api';

function getUserId(): number | null {
  const raw = localStorage.getItem('izo_user_id');
  return raw ? parseInt(raw, 10) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (userId) {
    headers['X-User-Id'] = String(userId);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.headers.get('content-type')?.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

export const api = {
  devLogin: (data: { name: string; role?: string; username?: string }) =>
    request<import('../types').User>('/dev-login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request<import('../types').User>('/me'),

  getScenarios: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Scenario[]>(`/scenarios${qs}`);
  },

  getScenario: (id: number) => request<import('../types').Scenario>(`/scenarios/${id}`),

  startTraining: (scenarioId: number) =>
    request<import('../types').Session>('/training/start', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    }),

  sendTrainingMessage: (sessionId: number, content: string) =>
    request<import('../types').Session>(`/training/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  finishTraining: (sessionId: number) =>
    request<{ session_id: number; score: number; result: import('../types').EvaluationResult }>(
      `/training/${sessionId}/finish`,
      { method: 'POST' }
    ),

  getTrainingSession: (sessionId: number) =>
    request<import('../types').Session>(`/training/${sessionId}`),

  startExam: () =>
    request<{
      exam_id: number;
      case_number: number;
      total_cases: number;
      session: import('../types').Session;
    }>('/exam/start', { method: 'POST' }),

  sendExamMessage: (examId: number, sessionId: number, content: string) =>
    request<import('../types').Session>(`/exam/${examId}/case/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  finishExamCase: (examId: number, sessionId: number) =>
    request<{ session_id: number; score: number; result: import('../types').EvaluationResult }>(
      `/exam/${examId}/case/${sessionId}/finish`,
      { method: 'POST' }
    ),

  getExam: (examId: number) => request<import('../types').ExamResult & { id: number; status: string; current_case?: import('../types').Session }>(`/exam/${examId}`),

  finishExam: (examId: number) =>
    request<import('../types').ExamResult>(`/exam/${examId}/finish`, { method: 'POST' }),

  getHistory: () => request<import('../types').HistoryItem[]>('/history'),

  getHistoryDetail: (sessionId: number) =>
    request<import('../types').HistoryDetail>(`/history/${sessionId}`),

  // Admin
  getAdminUsers: () => request<import('../types').AdminUser[]>('/admin/users'),

  updateUserRole: (userId: number, role: string) =>
    request<import('../types').AdminUser>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  getAdminScenarios: () => request<import('../types').Scenario[]>('/admin/scenarios'),

  createScenario: (data: Partial<import('../types').Scenario>) =>
    request<import('../types').Scenario>('/admin/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateScenario: (id: number, data: Partial<import('../types').Scenario>) =>
    request<import('../types').Scenario>(`/admin/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteScenario: (id: number) =>
    request<{ ok: boolean }>(`/admin/scenarios/${id}`, { method: 'DELETE' }),

  getAdminResults: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: import('../types').AdminResultItem[]; average_score: number | null; total: number }>(
      `/admin/results${qs}`
    );
  },

  exportResultsCsv: async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const userId = getUserId();
    const res = await fetch(`${API_BASE}/admin/results/export.csv${qs}`, {
      headers: userId ? { 'X-User-Id': String(userId) } : {},
    });
    return res.text();
  },
};
