import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, AlertCircle } from 'lucide-react';
import '../styles/RegisterPage.css';  // Importa o arquivo CSS

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player' // padrão jogador
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated, isMaster } = useAuth();
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
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação simples
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const { username, email, password, role } = formData;
    const result = await register({ username, email, password, role });

    if (result.success) {
      navigate(role === 'master' ? '/master-dashboard' : '/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon-container">
            <UserPlus size={40} color="white" />
          </div>
          <h1 className="register-title">
            Criar Conta
          </h1>
          <p className="register-subtitle">
            Preencha os dados para se registrar
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">
              Nome de usuário
            </label>
            <div className="input-container">
              <User className="input-icon" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Seu nome de usuário"
                className="input-field"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              Email
            </label>
            <div className="input-container">
              <Mail className="input-icon" size={20} />
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

          {/* Senha */}
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

          {/* Confirmar Senha */}
          <div className="form-group">
            <label className="form-label">
              Confirmar Senha
            </label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirme sua senha"
                className="input-field"
              />
            </div>
          </div>

          {/* Role (Jogador ou Mestre) */}
          <div className="form-group">
            <label className="form-label">
              Tipo de usuário
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="select-field"
            >
              <option value="player">Jogador</option>
              <option value="master">Mestre</option>
            </select>
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
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        {/* Link para login */}
        <div className="login-link">
          <p>
            Já tem conta?{' '}
            <Link to="/login">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;