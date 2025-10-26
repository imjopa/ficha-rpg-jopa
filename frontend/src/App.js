import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas que vamos criar
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayerDashboard from './pages/PlayerDashboard';
import MasterDashboard from './pages/MasterDashboard';
import CharacterSheet from './pages/CharacterSheet';
import LoadingSpinner from './components/LoadingSpinner';

// Componente para proteger rotas que precisam de autenticação
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Componente para rotas apenas de mestre
const MasterRoute = ({ children }) => {
  const { isMaster, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return isMaster() ? children : <Navigate to="/dashboard" />;
};

// Componente para redirecionamento baseado no papel do usuário
const DefaultRedirect = () => {
  const { isMaster, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return isMaster() ? <Navigate to="/master-dashboard" /> : <Navigate to="/dashboard" />;
};

// Componente principal de roteamento
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rotas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <PlayerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/master-dashboard" element={
        <MasterRoute>
          <MasterDashboard />
        </MasterRoute>
      } />

      <Route path="/master/character/:id" element={
        <MasterRoute>
          <CharacterSheet />
        </MasterRoute>
      } />

      <Route path="/character/:id" element={
        <ProtectedRoute>
          <CharacterSheet />
        </ProtectedRoute>
      } />

      {/* Rota padrão */}
      <Route path="/" element={<DefaultRedirect />} />
    </Routes>
  );
};

// App principal
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;