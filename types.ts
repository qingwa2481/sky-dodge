
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface Point {
  x: number;
  y: number;
}

export interface Bullet extends Point {
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface Player extends Point {
  radius: number;
  angle: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  analysis: string | null;
}
