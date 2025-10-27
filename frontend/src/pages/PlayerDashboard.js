import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { characterAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, FileText } from 'lucide-react';
import '../styles/PlayerDashboard.css';  // Importa o arquivo CSS

const PlayerDashboard = () => {
  const { user, logout } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Buscar fichas do usuário
  const fetchCharacters = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await characterAPI.getMyCharacters();
      setCharacters(response.data);
    } catch (err) {
      setError('Erro ao carregar suas fichas.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Criar nova ficha com dados básicos vazios e redirecionar para edição
  const handleCreateNew = async () => {
    try {
      const newCharacter = {
        basicInfo: {
          name: 'Novo Personagem',
          player: user.username,
          race: '',
          class: '',
          background: '',
          plan: '',
          religion: '',
          alignment: '',
          characterImage: ''
        },
        body: {
          move: 0,
          attack: 0,
          control: 0
        },
        cunning: {
          sway: 0,
          read: 0,
          hide: 0
        },
        intuition: {
          search: 0,
          focus: 0,
          sense: 0
        },
        status: {
          marks: { maximum: 0, current: 0 },
          luck: 0
        },
        skills: {
          raceskills: '',
          classskills: '',
          backgroundskills: ''
        },
        equipment: [],
        notes: {
          backstory: '',
          significantPeople: '',
          meaningfulLocations: '',
          treasuredPossessions: '',
          rituals: '',
          generalNotes: ''
        },
      };

      const response = await characterAPI.create(newCharacter);
      navigate(`/character/${response.data._id}`);
    } catch (err) {
      alert('Erro ao criar nova ficha.');
    }
  };

  // Deletar ficha
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta ficha?')) return;
    try {
      await characterAPI.delete(id);
      setCharacters(characters.filter(c => c._id !== id));
    } catch (err) {
      alert('Erro ao deletar ficha.');
    }
  };

  // Editar ficha (navegar para página da ficha)
  const handleEdit = (id) => {
    navigate(`/character/${id}`);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Olá, {user.username}! Suas Fichas</h1>
        <button
          onClick={logout}
          className="logout-button"
          title="Sair"
        >
          Sair
        </button>
      </header>

      <button
        onClick={handleCreateNew}
        className="create-button"
      >
        <PlusCircle size={20} /> Criar Nova Ficha
      </button>

      {loading && <p>Carregando suas fichas...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && characters.length === 0 && (
        <p>Você ainda não tem fichas. Clique em "Criar Nova Ficha" para começar.</p>
      )}

      {!loading && characters.length > 0 && (
        <table className="characters-table">
          <thead>
            <tr className="table-header">
              <th>Nome</th>
              <th>Função</th>
              <th>Última Atualização</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {characters.map((char) => (
              <tr key={char._id}>
                <td className="character-name" onClick={() => handleEdit(char._id)}>
                  <FileText size={16} className="character-name-icon" />
                  {char.basicInfo.name}
                </td>
                <td>{char.basicInfo.race || '-'}</td>
                <td>
                  {new Date(char.updatedAt).toLocaleDateString()} {new Date(char.updatedAt).toLocaleTimeString()}
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleEdit(char._id)}
                    title="Editar"
                    className="edit-button"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(char._id)}
                    title="Deletar"
                    className="delete-button"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PlayerDashboard;
