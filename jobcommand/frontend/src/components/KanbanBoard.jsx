import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import axios from 'axios';
import KanbanColumn from './KanbanColumn';
import { Sparkles, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

const COLUMNS = [
  { key: 'Applied', title: 'Applied', color: '#3B82F6' },
  { key: 'Screening', title: 'Screening', color: '#F59E0B' },
  { key: 'Interview', title: 'Interview', color: '#8B5CF6' },
  { key: 'Offer', title: 'Offer', color: '#10B981' },
  { key: 'Rejected', title: 'Rejected', color: '#EF4444' }
];

export default function KanbanBoard({ applications, onView, onEdit, onDelete, onStatusChanged }) {
  const [localApps, setLocalApps] = useState(applications);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileActiveTab, setMobileActiveTab] = useState('Applied');
  const [toast, setToast] = useState(null);

  // Sync state with parent applications data
  useEffect(() => {
    setLocalApps(applications);
  }, [applications]);

  // Window resize listener for responsive view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStatusChange = async (cardId, newStatus) => {
    const appToMove = localApps.find(a => a.id === cardId);
    if (!appToMove) return;
    const oldStatus = appToMove.status;
    if (oldStatus === newStatus) return;

    // Optimistic Update
    setLocalApps(prev => prev.map(a => a.id === cardId ? { ...a, status: newStatus } : a));

    try {
      await axios.patch(`${API_BASE}/applications/${cardId}/status`, { status: newStatus });
      
      setToast({
        message: `✓ Moved to ${newStatus}`,
        status: newStatus,
        type: 'success'
      });
      setTimeout(() => setToast(null), 2000);
      
      onStatusChanged();
    } catch (err) {
      console.error('Status patch error:', err);
      // Revert state
      setLocalApps(prev => prev.map(a => a.id === cardId ? { ...a, status: oldStatus } : a));
      setToast({
        message: `Failed to update status.`,
        status: oldStatus,
        type: 'error'
      });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const cardId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    
    await handleStatusChange(cardId, newStatus);
  };

  const getToastColor = (status, type) => {
    if (type === 'error') return 'border-red-500/20 bg-red-950/90 text-red-200 shadow-red-950/20';
    switch (status) {
      case 'Applied': return 'border-blue-500/20 bg-blue-950/90 text-blue-200';
      case 'Screening': return 'border-yellow-500/20 bg-yellow-950/90 text-yellow-200';
      case 'Interview': return 'border-purple-500/20 bg-purple-950/90 text-purple-200';
      case 'Offer': return 'border-emerald-500/20 bg-emerald-950/90 text-emerald-200';
      case 'Rejected': return 'border-rose-500/20 bg-rose-950/90 text-rose-200';
      default: return 'border-slate-800 bg-slate-905 text-slate-200';
    }
  };

  const getColApps = (statusKey) => {
    return localApps.filter(app => app.status === statusKey);
  };

  // MOBILE LAYOUT (<768px): Tabs with 1 column
  if (isMobile) {
    return (
      <DragDropContext onDragEnd={() => {}}>
        <div className="space-y-4">
          {/* Toast alerts */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${getToastColor(toast.status, toast.type)}`}>
              {toast.type === 'error' ? <AlertCircle className="h-5.5 w-5.5" /> : <Sparkles className="h-5.5 w-5.5" />}
              <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
            </div>
          )}

          {/* Mobile columns tabs */}
          <div className="flex border-b border-navy-850 overflow-x-auto gap-1.5 pb-1 select-none">
            {COLUMNS.map((col) => {
              const count = getColApps(col.key).length;
              const isActive = mobileActiveTab === col.key;
              return (
                <button
                  key={col.key}
                  onClick={() => setMobileActiveTab(col.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 shrink-0 transition-all ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{col.title}</span>
                  <span className={`h-4 min-w-4 flex items-center justify-center text-[9px] font-black rounded-full px-1 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-navy-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active mobile column rendering */}
          <div>
            {COLUMNS.map((col) => {
              if (col.key !== mobileActiveTab) return null;
              const colApps = getColApps(col.key);
              return (
                <div key={col.key}>
                  <KanbanColumn 
                    title={col.title}
                    color={col.color}
                    applications={colApps}
                    count={colApps.length}
                    statusKey={col.key}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    );
  }

  // DESKTOP & TABLET LAYOUT: Multi-column view
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Toast alerts */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${getToastColor(toast.status, toast.type)}`}>
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Grid columns container */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-full scrollbar items-start">
        {COLUMNS.map((col) => {
          const colApps = getColApps(col.key);
          return (
            <KanbanColumn
              key={col.key}
              title={col.title}
              color={col.color}
              applications={colApps}
              count={colApps.length}
              statusKey={col.key}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={handleStatusChange}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
