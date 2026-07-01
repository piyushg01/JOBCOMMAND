import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BellRing } from 'lucide-react';

export default function Sidebar({ pendingFollowupsCount }) {
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border-l-4 border-blue-500 shadow-inner'
        : 'text-slate-400 hover:bg-navy-800/50 hover:text-slate-200 border-l-4 border-transparent'
    }`;

  return (
    <aside className="w-64 border-r border-navy-800 bg-navy-950/80 px-4 py-6 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex flex-col gap-6">
        <div className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/" className={linkClasses} end>
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/add" className={linkClasses}>
            <PlusCircle className="h-5 w-5" />
            <span>Add Application</span>
          </NavLink>
          <NavLink to="/followups" className={linkClasses}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5" />
                <span>Follow-ups</span>
              </div>
              {pendingFollowupsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20 animate-bounce">
                  {pendingFollowupsCount}
                </span>
              )}
            </div>
          </NavLink>
        </nav>
      </div>
      
      <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-850 p-4 border border-navy-800 shadow-md">
        <h3 className="text-xs font-semibold text-slate-300">Pro Tip</h3>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Keep your resume up to date. JobCommand automatically identifies missing skills and formats follow-ups.
        </p>
      </div>
    </aside>
  );
}
