import React from 'react';
import { Trophy, Star, Sparkles, RotateCcw, Calendar, Flame } from 'lucide-react';
import { PlayerStats } from '../types';

interface EndingScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export default function EndingScreen({ stats, onRestart }: EndingScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-radial from-slate-900 via-amber-950/20 to-black p-4 select-none">
      
      {/* Sparkly Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/90 border border-amber-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center relative backdrop-blur-md animate-fade-in">
        
        {/* Glowing Trophy */}
        <div className="relative mb-6">
          <div className="absolute inset-0 w-20 h-20 bg-amber-500/30 rounded-full blur-xl animate-pulse"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-2xl flex items-center justify-center shadow-lg relative border border-amber-300">
            <Trophy className="w-10 h-10 text-amber-950 fill-amber-900/10" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce-short" />
          <Star className="absolute -bottom-1 -left-2 w-5 h-5 text-amber-400 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
            VICTORY ACHIEVED!
          </h1>
          <p className="text-xs font-mono text-amber-500 tracking-wider font-semibold uppercase">
            ผู้กล้าพิชิตปีศาจและบอสใหญ่ได้สำเร็จ!
          </p>
        </div>

        {/* Story Text */}
        <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-850">
          หลังจากปกป้องแผ่นดินและโค่นล้มเจ้าแห่งศาสตร์มืด <span className="text-amber-400 font-bold">Ancient Overlord</span> ประตูมิติกาลเวลาได้พากลับคืนสู่ความสงบสุขชั่วนิรันดร์...
        </p>

        {/* Statistics Board */}
        <div className="w-full bg-slate-900/80 border border-slate-850 p-4 rounded-2xl space-y-3 font-mono text-xs text-left mb-8">
          <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-850">
            <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> TOTAL DEFEATS:</span>
            <strong className="text-slate-100 text-sm font-bold">{stats.kills} ศัตรู</strong>
          </div>
          <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-850">
            <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> GAME LEVEL RATING:</span>
            <strong className="text-amber-400 text-sm font-bold">S+ EXCELLENT</strong>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>🛡️ SURVIVED WITH HP:</span>
            <strong className="text-rose-500 text-sm font-bold">{stats.health} / {stats.maxHealth} HEARTS</strong>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/20"
        >
          <RotateCcw className="w-4 h-4" />
          <span>PLAY AGAIN / เล่นใหม่อีกครั้ง</span>
        </button>

      </div>
    </div>
  );
}
