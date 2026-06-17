import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import TrainingChatPage from './pages/TrainingChatPage';
import ExamPage from './pages/ExamPage';
import ExamChatPage from './pages/ExamChatPage';
import ExamResultPage from './pages/ExamResultPage';
import HistoryPage from './pages/HistoryPage';
import HistoryDetailPage from './pages/HistoryDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminScenarioPage from './pages/AdminScenarioPage';
import Loading from './components/Loading';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/training/:scenarioId/chat"
        element={
          <ProtectedRoute>
            <TrainingChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId/case/:sessionId"
        element={
          <ProtectedRoute>
            <ExamChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:examId/result"
        element={
          <ProtectedRoute>
            <ExamResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history/:sessionId"
        element={
          <ProtectedRoute>
            <HistoryDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scenario/:id"
        element={
          <ProtectedRoute>
            <AdminScenarioPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
