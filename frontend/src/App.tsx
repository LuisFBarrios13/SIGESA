// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import LoginPage           from './pages/LoginPage';
import ChangePasswordPage  from './pages/ChangePasswordPage';
import DashboardPage       from './pages/DashboardPage';
import MatriculaPage       from './pages/MatriculaPage';
import DocentesPage        from './pages/DocentesPage';
import PagosPage           from './pages/PagosPage';      // ← nuevo

import Layout         from './components/layout/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout user={user!}><DashboardPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/matricula" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={user!}><MatriculaPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/docentes" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={user!}><DocentesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* ── Pagos — solo ADMINISTRADOR ── */}
      <Route path="/pagos" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={user!}><PagosPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;