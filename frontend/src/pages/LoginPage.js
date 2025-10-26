import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import '../styles/LoginPage.css';  // Importa o arquivo CSS

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, isMaster } = useAuth();
  const navigate = useNavigate();
  
  // Redirecionar se já estiver logado
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate(isMaster() ? '/master-dashboard' : '/dashboard');
    }
  }, [isAuthenticated, isMaster, navigate]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Limpar erro ao digitar
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirecionar baseado no tipo de usuário
      navigate(result.user.role === 'master' ? '/master-dashboard' : '/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-container">
            <LogIn size={40} color="white" />
          </div>
          <h1 className="login-title">
            Nosso RPG
          </h1>
          <p className="login-subtitle">
            Faça login para acessar suas fichas
          </p>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Campo Email */}
          <div className="form-group">
            <label className="form-label">
              Email
            </label>
            <div className="input-container">
              <User className="input-icon" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                className="input-field"
              />
            </div>
          </div>
          
          {/* Campo Senha */}
          <div className="form-group">
            <label className="form-label">
              Senha
            </label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Sua senha"
                className="input-field"
              />
            </div>
          </div>
          
          {/* Mostrar erro */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        {/* Link para registro */}
        <div className="register-link">
          <p>
            Não tem conta?{' '}
            <Link to="/register">
              Registre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;