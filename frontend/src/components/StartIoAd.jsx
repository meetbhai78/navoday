import React from 'react';

const StartIoAd = ({ type = 'banner', className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center bg-slate-900/40 border border-indigo-500/10 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm ${type === 'video' ? 'h-64' : 'h-[100px]'} ${className}`}>
      <div className="w-full bg-slate-950/40 text-center py-0.5">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Advertisement</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
        <span className="text-2xl mb-1">{type === 'video' ? '🎬' : '🖼️'}</span>
        <span className="text-xs font-semibold">{type === 'video' ? 'Start.io Video Ad' : 'Start.io Banner Ad'}</span>
        <span className="text-[10px] text-slate-500">App ID: 205539896</span>
      </div>
    </div>
  );
};

export default StartIoAd;
