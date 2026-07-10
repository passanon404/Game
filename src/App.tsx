import React, { useState } from 'react';
import { GamePhase, ControlConfig, PlayerStats, BossState } from './types';
import MainMenu from './components/MainMenu';
import GameHUD from './components/GameHUD';
import GameCanvas from './components/GameCanvas';
import EndingScreen from './components/EndingScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  // Phase control
  const [phase, setPhase] = useState<GamePhase>('MENU');

  // Control custom configurations (WASD is default)
  const [controls, setControls] = useState<ControlConfig>({
    moveUp: 'KeyW',
    moveDown: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    attack: 'KeyP',
    skill: 'KeyO',
  });

  // Player stats
  const [stats, setStats] = useState<PlayerStats>({
    health: 5,
    maxHealth: 5,
    kills: 0,
    score: 0,
    skillCooldown: 0,
    skillMaxCooldown: 5000, // 5 seconds
  });

  // Boss state (null if not spawned yet)
  const [boss, setBoss] = useState<BossState | null>(null);

  // Restart trigger
  const restartGame = () => {
    setStats({
      health: 5,
      maxHealth: 5,
      kills: 0,
      score: 0,
      skillCooldown: 0,
      skillMaxCooldown: 5000,
    });
    setBoss(null);
    setPhase('PLAYING');
  };

  const quitToMenu = () => {
    setBoss(null);
    setPhase('MENU');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-200 select-none relative font-sans">
      
      {/* 1. MAIN CANVAS (Visible and running only in PLAYING mode) */}
      {phase === 'PLAYING' && (
        <GameCanvas
          phase={phase}
          setPhase={setPhase}
          controls={controls}
          stats={stats}
          setStats={setStats}
          boss={boss}
          setBoss={setBoss}
        />
      )}

      {/* 2. HUD OVERLAY (Active only in PLAYING mode) */}
      {phase === 'PLAYING' && (
        <GameHUD
          stats={stats}
          boss={boss}
          controls={controls}
          onExit={quitToMenu}
        />
      )}

      {/* 3. MENU SCREEN (MENU and OPTIONS modes) */}
      {(phase === 'MENU' || phase === 'OPTIONS') && (
        <MainMenu
          phase={phase}
          setPhase={setPhase}
          controls={controls}
          setControls={setControls}
        />
      )}

      {/* 4. GAME OVER SCREEN (GAMEOVER mode) */}
      {phase === 'GAMEOVER' && (
        <GameOverScreen
          stats={stats}
          onRestart={restartGame}
        />
      )}

      {/* 5. VICTORY ENDING SCREEN (CLEAR mode) */}
      {phase === 'CLEAR' && (
        <EndingScreen
          stats={stats}
          onRestart={restartGame}
        />
      )}

    </div>
  );
}

