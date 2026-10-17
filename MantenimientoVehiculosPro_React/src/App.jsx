import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Vehiculos from './views/Vehiculos';
import Mantenimientos from './views/Mantenimientos';
import Usuarios from './views/Usuarios';
import ScanQR from './views/ScanQR';
import RutasGPS from './views/RutasGPS';
import CopilotoIA from './views/CopilotoIA';
import './App.css';

import ErrorBoundary from './components/ErrorBoundary';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#090d16' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componente para restringir acceso según el rol del usuario
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#090d16' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Si es un Conductor y no tiene acceso, redirigir a escanear-qr
    if (user?.role === 'CONDUCTOR') {
      return <Navigate to="/escanear-qr" replace />;
    }
    // De lo contrario a dashboard (o login si no está autenticado)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para redirigir por defecto según el rol
const DefaultRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'CONDUCTOR') {
    return <Navigate to="/rutas-gps" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta Pública de Login */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Privadas envueltas en Layout con Sidebar */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              {/* Redirección por defecto según rol */}
              <Route index element={<DefaultRedirect />} />

              {/* Dashboard: ADMIN, MECANICO */}
              <Route 
                path="dashboard" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />

              {/* Vehículos: ADMIN, MECANICO, CONDUCTOR (Vista catálogo de disponibilidad) */}
              <Route 
                path="vehiculos" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO', 'CONDUCTOR']}>
                    <Vehiculos />
                  </RoleProtectedRoute>
                } 
              />

              {/* Mantenimientos: ADMIN, MECANICO */}
              <Route 
                path="mantenimientos" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO']}>
                    <Mantenimientos />
                  </RoleProtectedRoute>
                } 
              />

              {/* Usuarios: Solo ADMIN */}
              <Route 
                path="usuarios" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <Usuarios />
                  </RoleProtectedRoute>
                } 
              />

              {/* Rutas y GPS: ADMIN, MECANICO, CONDUCTOR */}
              <Route 
                path="rutas-gps" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO', 'CONDUCTOR']}>
                    <RutasGPS />
                  </RoleProtectedRoute>
                } 
              />

              {/* Escanear QR: Para todos (ADMIN, MECANICO, CONDUCTOR) */}
              <Route 
                path="escanear-qr" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO', 'CONDUCTOR']}>
                    <ScanQR />
                  </RoleProtectedRoute>
                } 
              />

              {/* Copiloto Mecánico IA: ADMIN, MECANICO */}
              <Route 
                path="copiloto-ia" 
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN', 'MECANICO']}>
                    <CopilotoIA />
                  </RoleProtectedRoute>
                } 
              />
            </Route>

            {/* Comodín de redirección */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
