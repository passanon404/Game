import React, { useState, useEffect } from 'react';
import { Play, Settings, Keyboard, ShieldAlert, Sparkles, Volume2, RotateCcw } from 'lucide-react';
import { GamePhase, ControlConfig } from '../types';

interface MainMenuProps {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  controls: ControlConfig;
  setControls: (controls: ControlConfig) => void;
}

export default function MainMenu({ phase, setPhase, controls, setControls }: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [listeningKey, setListeningKey] = useState<keyof ControlConfig | null>(null);

  const presets = {
    wasd: {
      moveUp: 'KeyW',
      moveDown: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      attack: 'KeyP',
      skill: 'KeyO',
    },
    arrows: {
      moveUp: 'ArrowUp',
      moveDown: 'ArrowDown',
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      attack: 'KeyP',
      skill: 'KeyO',
    }
  };

  const applyPreset = (type: 'wasd' | 'arrows') => {
    setControls(presets[type]);
  };

  useEffect(() => {
    if (!listeningKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setControls({
        ...controls,
        [listeningKey]: e.code
      });
      setListeningKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningKey, controls, setControls]);

  // Display human readable key name from e.code
  const formatKeyName = (code: string) => {
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Arrow')) return code.replace('Arrow', ' ');
    if (code === 'Space') return 'Space';
    return code;
  };

  if (phase !== 'MENU' && phase !== 'OPTIONS') return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 select-none overflow-y-auto">
      {/* Animated glowing grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none"></div>

      {phase === 'MENU' ? (
        <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8 bg-slate-950/85 border border-slate-800 p-8 rounded-3xl shadow-2xl relative backdrop-blur-md">
          {/* Cosmic Glow */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

          {/* Logo container */}
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <img 
              src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782709347/logo_i8827v.png" 
              alt="Retro RPG Logo" 
              className="max-h-48 w-auto object-contain drop-shadow-[0_10px_20px_rgba(245,158,11,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent font-sans">
              RETRO 3D SPRITE RPG
            </h1>
            <p className="text-xs font-mono text-slate-400">
              ThreeJS 3D World × 2D 8-Way Billboarding Action
            </p>
          </div>

          {/* Action Menu */}
          <div className="w-full space-y-4 pt-4">
            <button
              id="btn-play"
              onClick={() => setPhase('PLAYING')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_24px_rgba(245,158,11,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/20"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START GAME / เข้าสู่เกม</span>
            </button>

            <button
              id="btn-options"
              onClick={() => setPhase('OPTIONS')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-5 h-5" />
              <span>OPTIONS / ปรับแต่งปุ่ม</span>
            </button>
          </div>

          {/* Quick instructions badge */}
          <div className="pt-2 text-left w-full border-t border-slate-900/60 text-[11px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>MOVE / เคลื่อนที่:</span>
              <span className="text-slate-400 font-bold">{formatKeyName(controls.moveUp)}{formatKeyName(controls.moveLeft)}{formatKeyName(controls.moveDown)}{formatKeyName(controls.moveRight)} / ARROW KEYS</span>
            </div>
            <div className="flex justify-between">
              <span>PUNCH / โจมตี:</span>
              <span className="text-slate-300 font-bold">P KEY (released hitbox)</span>
            </div>
            <div className="flex justify-between">
              <span>BURST SKILL / สกิลพลัง:</span>
              <span className="text-amber-400 font-bold">O KEY (expands ring)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 bg-slate-950/90 border border-slate-800 p-8 rounded-3xl shadow-2xl relative backdrop-blur-md animate-fade-in">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-3 w-full border-b border-slate-800 pb-4">
            <Keyboard className="w-7 h-7 text-amber-500" />
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-100">Controls Settings</h2>
              <p className="text-xs text-slate-400">เลือกปรับเปลี่ยนการบังคับปุ่มเดินและต่อย/ใช้สกิล</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-900 p-1 rounded-lg w-full">
            <button
              onClick={() => { setActiveTab('preset'); setListeningKey(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'preset' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              PRESET TEMPLATES
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'custom' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              CUSTOM KEYBOARD BINDINGS
            </button>
          </div>

          {activeTab === 'preset' ? (
            <div className="w-full grid grid-cols-2 gap-4 py-4">
              <button
                onClick={() => applyPreset('wasd')}
                className="p-4 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-amber-500/30 text-left transition-all group"
              >
                <div className="font-bold text-slate-200 group-hover:text-amber-400 mb-2">WASD Layout</div>
                <div className="text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Move: W, A, S, D</div>
                  <div>Attack: P</div>
                  <div>Skill: O</div>
                </div>
              </button>

              <button
                onClick={() => applyPreset('arrows')}
                className="p-4 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-amber-500/30 text-left transition-all group"
              >
                <div className="font-bold text-slate-200 group-hover:text-amber-400 mb-2">Arrow Keys Layout</div>
                <div className="text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Move: ↑, ↓, ←, →</div>
                  <div>Attack: P</div>
                  <div>Skill: O</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-2 py-2">
              <p className="text-[11px] text-slate-400 font-mono mb-2 text-left bg-slate-900/50 p-2 rounded border border-slate-800/40">
                💡 Click a field then press any key on your keyboard to map.
              </p>

              <div className="grid grid-cols-2 gap-2 text-left">
                {(Object.keys(controls) as Array<keyof ControlConfig>).map((key) => (
                  <div key={key} className="flex flex-col bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                      {key.replace('move', 'Move ')}
                    </span>
                    <button
                      onClick={() => setListeningKey(key)}
                      className={`mt-1 py-1.5 px-3 rounded text-sm font-mono font-bold text-center border transition-all ${
                        listeningKey === key
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {listeningKey === key ? 'PRESS ANY KEY' : formatKeyName(controls[key])}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Back Button */}
          <button
            onClick={() => {
              setPhase('MENU');
              setListeningKey(null);
            }}
            className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-semibold rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>SAVE & BACK TO MENU / บันทึกและกลับเมนู</span>
          </button>
        </div>
      )}
    </div>
  );
}
