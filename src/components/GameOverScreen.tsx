import React from 'react';
import { Skull, RotateCcw, AlertTriangle } from 'lucide-react';
import { PlayerStats } from '../types';

interface GameOverScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export default function GameOverScreen({ stats, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-radial from-slate-950 via-rose-950/20 to-black p-4 select-none">
      
      {/* Red Ambient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12)_0%,transparent_70%)] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-md bg-slate-950/95 border border-rose-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center relative backdrop-blur-md animate-fade-in">
        
        {/* Skull Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 w-20 h-20 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-rose-500/50 shadow-lg relative">
            <Skull className="w-10 h-10 text-rose-500" />
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-1 mb-6">
          <h1 className="text-4xl font-black tracking-widest text-transparent bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text">
            GAME OVER
          </h1>
          <p className="text-xs font-mono text-rose-500 tracking-widest font-bold uppercase">
            คุณสู้จนพลังชีวิตหมดสิ้น!
          </p>
        </div>

        {/* Stats segment */}
        <div className="w-full bg-slate-900/80 border border-slate-850 p-4 rounded-2xl space-y-2.5 font-mono text-xs text-left mb-8">
          <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-850">
            <span>💀 TOTAL KILLS:</span>
            <strong className="text-rose-400 font-bold text-sm">{stats.kills} ศัตรู</strong>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>🛡️ RECOVERY LEVEL:</span>
            <strong className="text-slate-200">
              {stats.kills >= 10 ? '🔥 Reached Boss Battle' : '🌱 Rookie Explorer'}
            </strong>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(225,29,72,0.4)] hover:shadow-[0_6px_24px_rgba(225,29,72,0.6)] transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RETRY / เริ่มเกมใหม่อีกครั้ง</span>
        </button>

      </div>
    </div>
  );
}
