import React from 'react';
import '../styles/LoadingSpinner.css';  // Importa o arquivo CSS

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Carregando...</p>
    </div>
  );
};

export default LoadingSpinner;
