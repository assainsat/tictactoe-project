
import React from 'react';
import { CellValue } from '../types';

interface SquareProps {
  value: CellValue;
  onClick: () => void;
  isWinner: boolean;
  disabled: boolean;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinner, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        h-24 w-24 sm:h-32 sm:w-32 
        flex items-center justify-center 
        text-5xl sm:text-6xl font-orbitron 
        transition-all duration-300
        border border-white/10
        cell-glow
        ${isWinner ? 'bg-green-500/20 scale-105 z-10' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={`
        ${value === 'X' ? 'text-blue-400 neon-text-blue' : 'text-purple-400 neon-text-purple'}
        ${isWinner ? 'animate-pulse' : ''}
      `}>
        {value}
      </span>
    </button>
  );
};

export default Square;
