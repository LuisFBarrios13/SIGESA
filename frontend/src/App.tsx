// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// ── Shared ────────────────────────────────────────────────────
import LoginPage          from './pages/shared/LoginPage';
import ChangePasswordPage from './pages/shared/ChangePasswordPage';

// ── Admin ─────────────────────────────────────────────────────
import DashboardPage   from './pages/admin/DashboardPage';
import MatriculaPage   from './pages/admin/MatriculaPage';
import DocentesPage    from './pages/admin/DocentesPage';
import PagosPage       from './pages/admin/PagosPage';
import DeudoresPage    from './pages/admin/DeudoresPage';
import EstudiantesPage from './pages/admin/EstudiantesPage';

// ── Acudiente ─────────────────────────────────────────────────
import AcudientePage from './pages/acudiente/AcudientePage';

import Layout         from './components/layout/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// ── Redirección inteligente según rol ─────────────────────────

const HomeRedirect = () => {
  const { user } = useAuth();
  const rol = user?.roles[0];

  if (rol === 'DOCENTE')   return <Navigate to="/docente"   replace />;
  if (rol === 'ACUDIENTE') return <Navigate to="/acudiente" replace />;
  return <DashboardPage />;
};

// ── Rutas principales ─────────────────────────────────────────

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const userProfile = user
    ? { name: user.username, role: user.roles[0] ?? '', avatarUrl: '' }
    : null;

  // Primer login: solo permite cambiar contraseña
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
      {/* Pública */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Raíz — redirige según rol */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout user={userProfile!}><HomeRedirect /></Layout>
        </ProtectedRoute>
      } />

      {/* ── Admin ──────────────────────────────────────────── */}
      <Route path="/matricula" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><MatriculaPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/docentes" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><DocentesPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/pagos" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><PagosPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/deudores" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><DeudoresPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><EstudiantesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* ── Acudiente ──────────────────────────────────────── */}
      <Route path="/acudiente" element={
        <ProtectedRoute roles={['ACUDIENTE']}>
          <Layout user={userProfile!}><AcudientePage /></Layout>
        </ProtectedRoute>
      } />

      {/* ── Docente (se agregarán aquí) ─────────────────────── */}
      {/* <Route path="/docente" element={...} /> */}

      {/* Fallback */}
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