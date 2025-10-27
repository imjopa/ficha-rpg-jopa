import React from 'react';
import '../styles/DiceRoller.css';  // Importa o arquivo CSS

const DiceHistory = ({ history }) => {
  return (
    <div className="dice-history-container">
      <h3 className="dice-history-title">Histórico de Rolagens</h3>
      {history.length === 0 ? (
        <p>Nenhuma rolagem realizada ainda.</p>
      ) : (
        <ul className="dice-history-list">
          {history.map((roll, index) => (
            <li key={index} className="dice-history-list-item">
              <div className="dice-history-header">
                <span className="dice-history-category">{roll.category || 'Geral'}</span>
              </div>
              <div>{roll.timestamp}</div>
              <div className="dice-history-roll-type">
                {roll.rollType === 'attribute' && `Atributo: ${roll.rollName}`}
                {roll.rollType === 'skill' && `Habilidade: ${roll.rollName}`}
                {roll.rollType === 'luck' && `Sorte: ${roll.rollName}`}
                {roll.rollType === 'damage' && `Dano: ${roll.rollName || 'Arma'}`}
                {roll.rollType === 'general' && `Geral: ${roll.numDice}x${roll.diceType}`}
              </div>
              {roll.rollType === 'damage' && (
                <div>Rolou {roll.numDice}x{roll.diceType}: Total {roll.total}</div>
              )}
              {roll.rollType === 'general' && (
                <div>Rolou {roll.numDice}x{roll.diceType}: Total {roll.total}</div>
              )}
              {roll.rolls && roll.rolls.length > 0 && roll.rollType !== 'attribute' && roll.rollType !== 'skill' && roll.rollType !== 'luck' && (
                <div>Detalhes: {roll.rolls.join(', ')}</div>
              )}
              {roll.breakdown && roll.breakdown.length > 0 && (
                <div className="dice-history-breakdown">
                  {roll.breakdown.join(' | ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DiceHistory;