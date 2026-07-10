export type GamePhase = 'MENU' | 'OPTIONS' | 'PLAYING' | 'GAMEOVER' | 'CLEAR';

export interface ControlConfig {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  attack: string;
  skill: string;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  kills: number;
  score: number;
  skillCooldown: number; // in ms or frames
  skillMaxCooldown: number;
}

export interface EnemyState {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  speed: number;
  isKnockback: boolean;
  knockbackDirection: [number, number, number];
  knockbackForce: number;
  knockbackTimer: number;
  flashColor: 'none' | 'red' | 'white';
  flashTimer: number;
  isDead: boolean;
  spawnTime: number;
  facingLeft: boolean;
  animFrame: number;
  animRow: number;
}

export interface BossState {
  position: [number, number, number];
  health: number;
  maxHealth: number;
  state: 'idle' | 'dash' | 'charging' | 'shoot' | 'cooldown';
  timer: number;
  targetPos: [number, number, number];
  scale: number;
  facingLeft: boolean;
  animFrame: number;
  animRow: number;
}

export interface FireballState {
  id: string;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  currentPos: [number, number, number];
  progress: number; // 0 to 1
  speed: number;
  radius: number;
}

export interface PotionState {
  id: string;
  position: [number, number, number];
  collected: boolean;
}
