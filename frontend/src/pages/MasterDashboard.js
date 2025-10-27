import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Edit, FileText, User, Plus, Trash2 } from 'lucide-react';
import '../styles/MasterDashboard.css';

const defaultSilhouette = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiM5OTk5OTkiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIxOCIgcj0iOCIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjAgMjZDOCAxOS4zIDIzLjcgMTYgMjggMTZIMzJDMzYuMyAxNiA0MiAxOS4zIDQyIDI2VjM0QzQyIDM1LjYgNDAuNiAzNyAzOSAzN0gyMUgzOUMyMC40IDM3IDIwIDM1LjYgMjAgMzRWMjZaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=';

const MasterDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isRecentUpdate = (updatedAt) => {
    const now = new Date();
    const updateDate = new Date(updatedAt);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return updateDate > twentyFourHoursAgo;
  };

  // Buscar todas as fichas do backend
  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await characterAPI.getAllCharacters();
      setCharacters(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar fichas');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Filtrar fichas pelo nome ou jogador
  const filteredCharacters = characters.filter(c =>
    (c.basicInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.owner?.username && c.owner.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Editar ficha (navegar para página da ficha)
  const handleEdit = (id) => {
    navigate(`/master/character/${id}`);
  };

  // Criar novo NPC
  const handleCreateNPC = async () => {
    try {
      const newCharacter = {
        characterType: 'npc',
        basicInfo: {
          name: 'Novo NPC',
          player: 'Mestre'
        },
        status: {
          scars: [
            { checked: false, description: '' },
            { checked: false, description: '' },
            { checked: false, description: '' }
          ]
        }
      };
      const response = await characterAPI.create(newCharacter);
      navigate(`/master/character/${response.data._id}`);
    } catch (err) {
      setError('Erro ao criar NPC');
    }
  };

  // Criar novo Monstro
  const handleCreateMonster = async () => {
    try {
      const newCharacter = {
        characterType: 'monster',
        basicInfo: {
          name: 'Novo Monstro',
          player: 'Mestre'
        },
        status: {
          scars: [
            { checked: false, description: '' },
            { checked: false, description: '' },
            { checked: false, description: '' }
          ]
        }
      };
      const response = await characterAPI.create(newCharacter);
      navigate(`/master/character/${response.data._id}`);
    } catch (err) {
      setError('Erro ao criar Monstro');
    }
  };

  // Deletar ficha
  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja deletar a ficha "${name}"? Esta ação não pode ser desfeita.`)) {
      try {
        await characterAPI.delete(id);
        fetchCharacters(); // Recarregar a lista após deletar
      } catch (err) {
        setError('Erro ao deletar ficha');
      }
    }
  };



  return (
    <div className="master-dashboard">
      <header className="master-dashboard-header">
        <div className="master-dashboard-header-content">
          <h1 className="master-dashboard-title">Dashboard Do Mestre</h1>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="master-dashboard-logout-btn"
            title="Sair"
          >
            Sair
          </button>
        </div>
        <div className="master-dashboard-title-line"></div>
      </header>
      <div className="master-dashboard-main">
        <div className="master-dashboard-create-buttons">
          <button
            onClick={handleCreateNPC}
            className="master-dashboard-create-btn"
            title="Criar NPC"
          >
            <Plus size={16} /> Criar NPC
          </button>
          <button
            onClick={handleCreateMonster}
            className="master-dashboard-create-btn"
            title="Criar Monstro"
          >
            <Plus size={16} /> Criar Monstro
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou jogador"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="master-dashboard-search"
        />

      {loading && (
        <div className="master-dashboard-loading">
          <p>Carregando fichas...</p>
        </div>
      )}
      {error && (
        <div className="master-dashboard-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && filteredCharacters.length === 0 && (
        <div className="master-dashboard-no-results">
          <p>Nenhuma ficha encontrada.</p>
        </div>
      )}

      {!loading && filteredCharacters.length > 0 && (
        <div className="master-dashboard-grid">
          {filteredCharacters.map((character) => {
            const name = character.basicInfo?.name || 'Sem nome';
            const player = character.owner?.username || 'Desconhecido';
            const level = character.basicInfo?.level || 0;
            const isRecent = isRecentUpdate(character.updatedAt);
            const imageSrc = character.image || defaultSilhouette;

            return (
              <div
                key={character._id}
                className="master-dashboard-card"
              >
                <img
                  src={imageSrc}
                  alt={name}
                  className="master-dashboard-card-img"
                />
                <p className="master-dashboard-card-player">
                  {player}
                </p>
                <h3
                  className="master-dashboard-card-name"
                  onClick={() => handleEdit(character._id)}
                >
                  <FileText size={16} className="master-dashboard-card-name-icon" />
                  {name}
                </h3>
                <span
                  className={`master-dashboard-card-status ${isRecent ? 'active' : ''}`}
                >
                  {isRecent ? 'Ativo' : 'Ocioso'}
                </span>
                <div className="master-dashboard-card-stats">
                  <div className="master-dashboard-card-level">
                    {level}
                  </div>
                  <span className="master-dashboard-card-type">
                    {character.basicInfo?.class || 'Sem classe'}
                  </span>
                </div>
                <div className="master-dashboard-card-buttons">
                  <button
                    onClick={() => handleEdit(character._id)}
                    title="Editar"
                    className="master-dashboard-card-edit-btn"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(character._id, name)}
                    title="Deletar"
                    className="master-dashboard-card-delete-btn"
                  >
                    <Trash2 size={16} />
                    Deletar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default MasterDashboard;
