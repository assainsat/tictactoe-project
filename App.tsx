
import React, { useState, useEffect, useCallback } from 'react';
import { Player, CellValue, GameMode, GameStatus, GameState } from './types';
import Square from './components/Square';
import { getAiMove } from './services/geminiService';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

const INITIAL_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  status: 'PLAYING',
  winnerLine: null,
  mode: GameMode.PVP,
  isAiThinking: false,
  commentary: "Welcome to the arena. Choose your mode and begin."
};

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });

  const checkWinner = (board: CellValue[]): { status: GameStatus; line: number[] | null } => {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { status: board[a] === 'X' ? 'X_WON' : 'O_WON', line };
      }
    }
    if (board.every(cell => cell !== null)) {
      return { status: 'DRAW', line: null };
    }
    return { status: 'PLAYING', line: null };
  };

  const handleMove = useCallback((index: number) => {
    if (game.board[index] || game.status !== 'PLAYING' || game.isAiThinking) return;

    const newBoard = [...game.board];
    newBoard[index] = game.currentPlayer;
    const { status, line } = checkWinner(newBoard);

    setGame(prev => ({
      ...prev,
      board: newBoard,
      status,
      winnerLine: line,
      currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
      commentary: status === 'PLAYING' ? prev.commentary : 
                   status === 'DRAW' ? "A stalemate? I expected better." : 
                   `${status === 'X_WON' ? 'X' : 'O'} has claimed victory!`
    }));

    if (status !== 'PLAYING') {
      setScores(prev => ({
        ...prev,
        [status === 'DRAW' ? 'Draws' : (status === 'X_WON' ? 'X' : 'O')]: prev[status === 'DRAW' ? 'Draws' : (status === 'X_WON' ? 'X' : 'O')] + 1
      }));
    }
  }, [game]);

  // AI Turn Effect
  useEffect(() => {
    if (game.status === 'PLAYING' && 
       ((game.mode === GameMode.PVE_BASIC || game.mode === GameMode.PVE_AI) && game.currentPlayer === 'O')) {
      
      const makeAiMove = async () => {
        setGame(prev => ({ ...prev, isAiThinking: true }));

        if (game.mode === GameMode.PVE_BASIC) {
          // Simple delay for basic AI
          setTimeout(() => {
            const available = game.board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
            const move = available[Math.floor(Math.random() * available.length)];
            setGame(prev => ({ ...prev, isAiThinking: false }));
            handleMove(move);
          }, 600);
        } else {
          // Artificial Intelligence (Gemini)
          const { index, commentary } = await getAiMove(game.board, 'O', 'X');
          setGame(prev => ({ ...prev, isAiThinking: false, commentary }));
          handleMove(index);
        }
      };

      makeAiMove();
    }
  }, [game.currentPlayer, game.status, game.mode, handleMove, game.board]);

  const resetGame = () => {
    setGame(prev => ({
      ...INITIAL_STATE,
      mode: prev.mode,
      commentary: "A new round begins. Don't disappoint me."
    }));
  };

  const changeMode = (mode: GameMode) => {
    setScores({ X: 0, O: 0, Draws: 0 });
    setGame({
      ...INITIAL_STATE,
      mode,
      commentary: mode === GameMode.PVE_AI ? "You dare challenge the Artificial Intelligence Grandmaster?" : "Entering local multiplayer combat."
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-6xl font-orbitron font-bold text-white mb-2 tracking-widest flex items-center justify-center gap-4">
          <i className="fas fa-microchip text-blue-500 text-3xl sm:text-4xl"></i>
          TIC-TAC-TOE
          <span className="text-blue-500 font-light">PRO</span>
        </h1>
        <p className="text-blue-300/60 uppercase tracking-widest text-xs sm:text-sm font-semibold">
          {game.mode === GameMode.PVE_AI ? 'VS Artificial Intelligence Grandmaster' : 
           game.mode === GameMode.PVE_BASIC ? 'VS Training Bot' : 'Local 2-Player'}
        </p>
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl w-full">
        
        {/* Left Side: Controls & Stats */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <h2 className="text-white font-orbitron mb-4 text-sm tracking-tighter flex items-center gap-2">
              <i className="fas fa-gamepad text-blue-400"></i> MODE SELECTION
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: GameMode.PVP, label: 'Local PvP', icon: 'fa-users' },
                { id: GameMode.PVE_BASIC, label: 'Training Bot', icon: 'fa-robot' },
                { id: GameMode.PVE_AI, label: 'Advanced AI', icon: 'fa-brain' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => changeMode(m.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold
                    ${game.mode === m.id ? 'bg-blue-600 text-white neon-border' : 'bg-white/5 text-gray-400 hover:bg-white/10'}
                  `}
                >
                  <i className={`fas ${m.icon}`}></i>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <h2 className="text-white font-orbitron mb-4 text-sm tracking-tighter flex items-center gap-2">
              <i className="fas fa-chart-bar text-purple-400"></i> SCOREBOARD
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-blue-400 font-bold mb-1">X</p>
                <p className="text-2xl font-orbitron text-white">{scores.X}</p>
              </div>
              <div>
                <p className="text-xs text-purple-400 font-bold mb-1">O</p>
                <p className="text-2xl font-orbitron text-white">{scores.O}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">DRAW</p>
                <p className="text-2xl font-orbitron text-white">{scores.Draws}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Game Board */}
        <div className="relative order-1 lg:order-2">
          {game.isAiThinking && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl border border-blue-500/30">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-blue-400 font-orbitron text-sm animate-pulse text-center">ARTIFICIAL INTELLIGENCE<br/>IS THINKING...</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {game.board.map((cell, i) => (
              <Square
                key={i}
                value={cell}
                onClick={() => handleMove(i)}
                isWinner={game.winnerLine?.includes(i) || false}
                disabled={game.status !== 'PLAYING' || game.isAiThinking}
              />
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={resetGame}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-orbitron rounded-full border border-white/20 transition-all flex items-center gap-2 hover:scale-105"
            >
              <i className="fas fa-undo"></i> RESET ARENA
            </button>
          </div>
        </div>

        {/* Right Side: AI Interaction */}
        <div className="w-full lg:w-1/4 order-3">
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md h-full min-h-[200px] flex flex-col justify-between">
            <div>
              <h2 className="text-white font-orbitron mb-4 text-sm tracking-tighter flex items-center gap-2">
                <i className="fas fa-comment-dots text-green-400"></i> AI COMMS
              </h2>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 italic text-sm text-gray-300 leading-relaxed font-light">
                "{game.commentary}"
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">NEXT TURN</span>
                <span className={`font-bold ${game.currentPlayer === 'X' ? 'text-blue-400' : 'text-purple-400'}`}>
                   PLAYER {game.currentPlayer}
                </span>
              </div>
              <div className="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${game.currentPlayer === 'X' ? 'bg-blue-500 w-1/2' : 'bg-purple-500 w-full'}`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-white/20 text-[10px] tracking-widest font-orbitron uppercase">
        Powered by Artificial Intelligence &bull; Built by Prodigy Infotech
      </footer>
    </div>
  );
};

export default App;
