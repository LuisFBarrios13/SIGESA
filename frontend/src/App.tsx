// src/App.tsx
// Cada pantalla se descarga por separado (lazy) la primera vez que se visita;
// el login se incluye en el paquete inicial porque es lo primero que se ve.
import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

import LoginPage          from './pages/shared/LoginPage';
import Layout             from './components/layout/Layout';
import ProtectedRoute     from './components/ui/ProtectedRoute';

const ChangePasswordPage = lazy(() => import('./pages/shared/ChangePasswordPage'));

const DashboardPage   = lazy(() => import('./pages/admin/DashboardPage'));
const MatriculaPage   = lazy(() => import('./pages/admin/MatriculaPage'));
const DocentesPage    = lazy(() => import('./pages/admin/DocentesPage'));
const PagosPage       = lazy(() => import('./pages/admin/PagosPage'));
const DeudoresPage    = lazy(() => import('./pages/admin/DeudoresPage'));
const EstudiantesPage = lazy(() => import('./pages/admin/EstudiantesPage'));

const AcudientePage = lazy(() => import('./pages/acudiente/AcudientePage'));

const MiGradoPage = lazy(() => import('./pages/docente/MiGradoPage'));
const NotasPage   = lazy(() => import('./pages/docente/NotasPage'));
const BoletinPage = lazy(() => import('./pages/docente/BoletinPage'));

/** Mientras se descarga una pantalla. */
const CargandoPagina = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Cargando">
    <span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span>
  </div>
);

const Cargar = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<CargandoPagina />}>{children}</Suspense>
);

const HomeRedirect = () => {
  const { user } = useAuth();
  const rol = user?.roles[0];
  if (rol === 'DOCENTE')   return <Navigate to="/docente"   replace />;
  if (rol === 'ACUDIENTE') return <Navigate to="/acudiente" replace />;
  return <DashboardPage />;
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const userProfile = user
    ? { name: user.nombre ?? user.username, role: user.roles[0] ?? '', avatarUrl: '' }
    : null;

  if (isAuthenticated && user?.primerLogin) {
    return (
      <Routes>
        <Route path="/change-password" element={<Cargar><ChangePasswordPage /></Cargar>} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* ── Inicio ── */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout user={userProfile!}><Cargar><HomeRedirect /></Cargar></Layout>
        </ProtectedRoute>
      } />

      {/* ── Admin ── */}
      <Route path="/matricula" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><Cargar><MatriculaPage /></Cargar></Layout>
        </ProtectedRoute>
      } />
      <Route path="/docentes" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><Cargar><DocentesPage /></Cargar></Layout>
        </ProtectedRoute>
      } />
      <Route path="/pagos" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><Cargar><PagosPage /></Cargar></Layout>
        </ProtectedRoute>
      } />
      <Route path="/deudores" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><Cargar><DeudoresPage /></Cargar></Layout>
        </ProtectedRoute>
      } />
      <Route path="/estudiantes" element={
        <ProtectedRoute roles={['ADMINISTRADOR']}>
          <Layout user={userProfile!}><Cargar><EstudiantesPage /></Cargar></Layout>
        </ProtectedRoute>
      } />

      {/* ── Acudiente ── */}
      <Route path="/acudiente" element={
        <ProtectedRoute roles={['ACUDIENTE']}>
          <Layout user={userProfile!}><Cargar><AcudientePage /></Cargar></Layout>
        </ProtectedRoute>
      } />

      {/* ── Docente ── */}
      <Route path="/docente" element={
        <ProtectedRoute roles={['DOCENTE']}>
          <Layout user={userProfile!}><Cargar><MiGradoPage /></Cargar></Layout>
        </ProtectedRoute>
      } />
      <Route path="/docente/notas" element={
        <ProtectedRoute roles={['DOCENTE']}>
          <Layout user={userProfile!}><Cargar><NotasPage /></Cargar></Layout>
        </ProtectedRoute>
      } />

      {/* ── Boletín sin Layout (página de impresión limpia) ── */}
      <Route path="/docente/boletin" element={
        <ProtectedRoute roles={['DOCENTE', 'ADMINISTRADOR']}>
          <Cargar><BoletinPage /></Cargar>
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