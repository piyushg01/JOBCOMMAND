import React from 'react';

export default function StatusBadge({ status }) {
  let classes = '';
  switch (status) {
    case 'Applied':
      classes = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      break;
    case 'Screening':
      classes = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;
    case 'Interview':
      classes = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      break;
    case 'Offer':
      classes = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;
    case 'Rejected':
      classes = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      break;
    default:
      classes = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shadow-sm ${classes}`}>
      {status}
    </span>
  );
}
