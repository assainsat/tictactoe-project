
export type Player = 'X' | 'O';
export type CellValue = Player | null;

export enum GameMode {
  PVP = 'PVP',
  PVE_BASIC = 'PVE_BASIC',
  PVE_AI = 'PVE_AI'
}

export type GameStatus = 'PLAYING' | 'X_WON' | 'O_WON' | 'DRAW';

export interface GameState {
  board: CellValue[];
  currentPlayer: Player;
  status: GameStatus;
  winnerLine: number[] | null;
  mode: GameMode;
  isAiThinking: boolean;
  commentary: string;
}
