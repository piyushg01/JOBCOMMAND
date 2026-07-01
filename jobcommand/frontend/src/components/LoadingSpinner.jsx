import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'AI is processing...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-navy-800 bg-navy-900 p-8 shadow-2xl shadow-black/50 max-w-sm text-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-12 w-12 rounded-full border border-blue-500/20 animate-ping"></div>
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Please Wait</h4>
          <p className="mt-1 text-xs text-slate-400 font-medium animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
}
