import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ 
  title, 
  color, 
  applications, 
  count, 
  statusKey, 
  onView, 
  onEdit, 
  onDelete,
  onStatusChange
}) {
  const getBadgeClasses = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Screening': return 'bg-yellow-100 text-yellow-800';
      case 'Interview': return 'bg-purple-100 text-purple-800';
      case 'Offer': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-[280px] bg-navy-950/40 border border-navy-850 rounded-2xl p-4 shadow-sm h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-navy-850/60">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}></span>
          <h3 className="font-bold text-white text-sm tracking-wide">{title}</h3>
        </div>
        <span className={`inline-flex items-center justify-center text-[10px] font-black rounded-full h-5 px-2.5 shadow-sm ${getBadgeClasses(statusKey)}`}>
          {count}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-xl transition-all duration-200 min-h-[450px] flex flex-col gap-4 py-2 px-1 ${
              snapshot.isDraggingOver ? 'bg-navy-900/40 ring-1 ring-blue-500/10' : ''
            }`}
          >
            {applications.map((app, idx) => (
              <KanbanCard 
                key={app.id} 
                application={app} 
                index={idx}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
            {provided.placeholder}
            
            {applications.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-navy-800/80 rounded-xl py-16 text-center text-slate-500 hover:text-slate-400 hover:border-navy-750 transition-colors select-none">
                <p className="text-xs font-semibold">Drop here</p>
                <p className="text-[10px] text-slate-600 mt-1">Move card to change status</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
