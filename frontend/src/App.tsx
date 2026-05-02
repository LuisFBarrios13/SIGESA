// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Pages
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import MatriculaPage from './pages/MatriculaPage';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// ── Inner router (needs to be inside AuthProvider) ────────────

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  // Force password change on first login
  if (isAuthenticated && user?.primerLogin) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected — all roles */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout user={user!}>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected — ADMINISTRADOR only */}
      <Route
        path="/matricula"
        element={
          <ProtectedRoute roles={['ADMINISTRADOR']}>
            <Layout user={user!}>
              <MatriculaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ── Root ──────────────────────────────────────────────────────

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;