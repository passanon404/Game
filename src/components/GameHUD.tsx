import React from 'react';
import { Heart, Trophy, Zap, Shield, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import { PlayerStats, BossState, ControlConfig } from '../types';

interface GameHUDProps {
  stats: PlayerStats;
  boss: BossState | null;
  controls: ControlConfig;
  onExit: () => void;
}

export default function GameHUD({ stats, boss, controls, onExit }: GameHUDProps) {
  const hearts = Array.from({ length: stats.maxHealth });
  
  // Calculate skill percentage
  const skillPercent = Math.min(100, Math.max(0, (1 - stats.skillCooldown / stats.skillMaxCooldown) * 100));

  const formatKeyName = (code: string) => {
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Arrow')) return code.replace('Arrow', ' ');
    return code;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 font-sans select-none">
      
      {/* Top HUD Row */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        
        {/* Left Side: HP and Controls Reminder */}
        <div className="flex flex-col gap-2">
          {/* Health Segment */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1.5 backdrop-blur-md shadow-lg min-w-44">
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400">PLAYER LIFE</span>
            <div className="flex items-center gap-1.5">
              {hearts.map((_, idx) => {
                const isActive = idx < stats.health;
                return (
                  <Heart
                    key={idx}
                    className={`w-6 h-6 transition-all duration-300 ${
                      isActive 
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)] scale-100' 
                        : 'text-slate-700 scale-90 opacity-40'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-950/80 border border-slate-800/80 py-1.5 px-3 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-md text-xs font-mono text-slate-300 w-fit">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>KILLS: <strong className="text-amber-400">{stats.kills}</strong></span>
            </div>
            <div className="w-[1px] h-3 bg-slate-800"></div>
            {stats.kills < 10 ? (
              <span className="text-[10px] text-slate-400">
                Boss in: <strong className="text-cyan-400">{10 - stats.kills}</strong>
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                BOSS FIGHT!
              </span>
            )}
          </div>
        </div>

        {/* Boss HP Bar in the center-top if active */}
        {boss && boss.health > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 backdrop-blur-md shadow-2xl animate-bounce-short">
            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-orange-500 font-extrabold tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                ANCIENT OVERLORD BOSS
              </span>
              <span className="text-slate-300 font-bold">{Math.ceil((boss.health / boss.maxHealth) * 100)}%</span>
            </div>
            
            {/* Health Track */}
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }}
              ></div>
            </div>
            <div className="text-[9px] font-mono text-center text-slate-400 uppercase mt-0.5">
              Status: {boss.state === 'charging' ? '🔥 charging blast' : boss.state === 'dash' ? '💨 fast dashing' : 'idle / flying'}
            </div>
          </div>
        )}

        {/* Right Side: Back to Menu / Score */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold backdrop-blur-md shadow-md transition-all cursor-pointer"
          >
            QUIT / ออกเมนู
          </button>

          {/* Quick HUD guide */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl backdrop-blur-md shadow-md text-[10px] font-mono text-slate-400 space-y-0.5 max-w-48 text-right hidden sm:block">
            <div className="text-slate-500 font-bold border-b border-slate-900 pb-0.5 mb-1 flex items-center gap-1 justify-end">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              GUIDE
            </div>
            <div>Move: <span className="text-slate-200">{formatKeyName(controls.moveUp)}{formatKeyName(controls.moveLeft)}{formatKeyName(controls.moveDown)}{formatKeyName(controls.moveRight)}</span> / Arrow Keys</div>
            <div>Punch: <span className="text-amber-400 font-bold">{formatKeyName(controls.attack)}</span></div>
            <div>Power Ring: <span className="text-cyan-400 font-bold">{formatKeyName(controls.skill)}</span></div>
          </div>
        </div>

      </div>

      {/* Bottom HUD Row: Skills & Cooldowns */}
      <div className="w-full flex justify-center items-end pb-2">
        <div className="bg-slate-950/85 border border-slate-800/80 px-6 py-3.5 rounded-2xl flex items-center gap-6 backdrop-blur-md shadow-2xl pointer-events-auto">
          
          {/* Action: Punch (P) */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-850 group">
              <Zap className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {formatKeyName(controls.attack)}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-slate-500">PUNCH ATTACK</span>
              <span className="text-xs font-semibold text-slate-200">Release Hitbox</span>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-slate-800"></div>

          {/* Action: Burst Skill (O) */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-850 overflow-hidden">
              {/* Cooldown Circle overlay */}
              <div 
                className="absolute inset-0 bg-cyan-950/70 transition-all duration-100 border-t border-cyan-500/20"
                style={{ clipPath: `inset(${skillPercent}% 0px 0px 0px)` }}
              ></div>
              <Sparkles className="w-6 h-6 text-cyan-400 relative z-10" />
              <div className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center relative z-20">
                {formatKeyName(controls.skill)}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-slate-500">BURST POWER</span>
              {stats.skillCooldown > 0 ? (
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {(stats.skillCooldown / 1000).toFixed(1)}s
                </span>
              ) : (
                <span className="text-xs font-bold text-cyan-300 animate-pulse">READY</span>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
