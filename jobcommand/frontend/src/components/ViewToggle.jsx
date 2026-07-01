import React from 'react';
import { Table, LayoutGrid } from 'lucide-react';

export default function ViewToggle({ currentView, onViewChange }) {
  const handleViewChange = (newView) => {
    localStorage.setItem('jobcommand_view_preference', newView);
    onViewChange(newView);
  };

  return (
    <div className="inline-flex rounded-lg bg-navy-950 p-1 border border-navy-800 shadow-inner">
      <button
        type="button"
        onClick={() => handleViewChange('table')}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
          currentView === 'table'
            ? 'bg-blue-600 text-white shadow shadow-blue-600/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900/50'
        }`}
      >
        <Table className="h-3.5 w-3.5" />
        <span>📋 Table View</span>
      </button>
      
      <button
        type="button"
        onClick={() => handleViewChange('kanban')}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
          currentView === 'kanban'
            ? 'bg-blue-600 text-white shadow shadow-blue-600/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900/50'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>🗂️ Kanban View</span>
      </button>
    </div>
  );
}
