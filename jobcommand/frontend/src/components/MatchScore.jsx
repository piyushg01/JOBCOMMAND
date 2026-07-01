import React from 'react';

export default function MatchScore({ score, size = 'md' }) {
  let textColors = '';
  let borderColors = '';
  let glowColors = '';

  if (score >= 80) {
    textColors = 'text-emerald-400';
    borderColors = 'border-emerald-500/30 bg-emerald-500/10';
    glowColors = 'shadow-emerald-500/10';
  } else if (score >= 50) {
    textColors = 'text-amber-400';
    borderColors = 'border-amber-500/30 bg-amber-500/10';
    glowColors = 'shadow-amber-500/10';
  } else {
    textColors = 'text-rose-400';
    borderColors = 'border-rose-500/30 bg-rose-500/10';
    glowColors = 'shadow-rose-500/10';
  }

  const dimensions = size === 'lg'
    ? 'h-28 w-28 text-3xl border-4'
    : 'h-12 w-12 text-sm border-2';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`flex items-center justify-center rounded-full font-extrabold tracking-tight shadow-md transition-all duration-300 ${dimensions} ${textColors} ${borderColors} ${glowColors}`}>
        {score}%
      </div>
    </div>
  );
}
