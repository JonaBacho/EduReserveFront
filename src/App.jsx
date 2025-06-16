// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import Reservations from './pages/Reservations';
import MesReservations from './pages/MesReservations';
import Salles from './pages/Salles';
import Materiels from './pages/Materiels';
import Formations from './pages/Formations';
import Statistiques from './pages/Statistiques';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requireAuth = true }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function EnseignantRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.user_type !== 'enseignant') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      {/* Routes publiques (non connecté) */}
      <Route 
        path="/login" 
        element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <ProtectedRoute requireAuth={false}>
            <Register />
          </ProtectedRoute>
        } 
      />
      
      {/* Routes protégées (connecté) */}
      <Route 
        path="/reset-password" 
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/planning" 
        element={
          <ProtectedRoute>
            <Layout>
              <Planning />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/salles" 
        element={
          <ProtectedRoute>
            <Layout>
              <Salles />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/materiels" 
        element={
          <ProtectedRoute>
            <Layout>
              <Materiels />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/formations" 
        element={
          <ProtectedRoute>
            <Layout>
              <Formations />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Routes réservées aux enseignants */}
      <Route 
        path="/reservations" 
        element={
          <EnseignantRoute>
            <Layout>
              <Reservations />
            </Layout>
          </EnseignantRoute>
        } 
      />
      
      <Route 
        path="/mes-reservations" 
        element={
          <EnseignantRoute>
            <Layout>
              <MesReservations />
            </Layout>
          </EnseignantRoute>
        } 
      />
      
      <Route 
        path="/statistiques" 
        element={
          <EnseignantRoute>
            <Layout>
              <Statistiques />
            </Layout>
          </EnseignantRoute>
        } 
      />
      
      {/* Route 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#374151',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  style: {
                    background: '#059669',
                  },
                  iconTheme: {
                    primary: '#ffffff',
                    secondary: '#059669',
                  },
                },
                error: {
                  style: {
                    background: '#dc2626',
                  },
                  iconTheme: {
                    primary: '#ffffff',
                    secondary: '#dc2626',
                  },
                },
                loading: {
                  style: {
                    background: '#3b82f6',
                  },
                },
              }}
            />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;