import React from 'react';
import { Briefcase } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-navy-800 bg-navy-900 px-6 text-white shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
          <Briefcase className="h-5.5 w-5.5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            JobCommand
          </h1>
          <p className="text-[10px] text-navy-400 uppercase tracking-widest font-semibold">
            AI Job Search Command Centre
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span className="text-xs text-slate-400 font-medium">AI Core Connected</span>
      </div>
    </header>
  );
}
