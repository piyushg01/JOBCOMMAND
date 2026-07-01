import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Eye, Pencil, Trash2, Calendar, Clock, Sparkles } from 'lucide-react';

const STATUSES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

export default function KanbanCard({ application, index, onView, onEdit, onDelete, onStatusChange }) {
  const getBorderColor = (status) => {
    switch (status) {
      case 'Applied': return 'border-blue-400';
      case 'Screening': return 'border-yellow-400';
      case 'Interview': return 'border-purple-400';
      case 'Offer': return 'border-green-400';
      case 'Rejected': return 'border-red-400';
      default: return 'border-slate-800';
    }
  };

  const getScoreColor = (score) => {
    if (score > 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getDaysAgoText = (dateString) => {
    const diffTime = new Date() - new Date(dateString);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <Draggable draggableId={String(application.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
              : provided.draggableProps.style?.transform,
          }}
          className={`rounded-xl border bg-navy-900 p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg select-none ${
            snapshot.isDragging 
              ? 'shadow-2xl shadow-black/60 ring-2 ring-blue-500/40 z-50 cursor-grabbing bg-navy-850' 
              : 'cursor-grab'
          } ${getBorderColor(application.status)}`}
        >
          {/* Header Info */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-white text-base tracking-tight leading-snug line-clamp-1">{application.company_name}</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 line-clamp-1">{application.role_title}</p>
            </div>
            {application.score_after_tailor && (
              <span className="flex h-5 items-center gap-1 rounded bg-indigo-500/10 px-1.5 text-[9px] font-black text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5" />
                Tailored
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              <span>Match Score</span>
              <span className="font-extrabold">{application.match_score}%</span>
            </div>
            <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden border border-navy-850">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${getScoreColor(application.match_score)}`}
                style={{ width: `${application.match_score}%` }}
              ></div>
            </div>
          </div>

          {/* Date info */}
          <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-400 border-t border-navy-850/60 pt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Applied: {new Date(application.application_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{getDaysAgoText(application.application_date)}</span>
            </div>
          </div>

          {/* Mobile move selector dropdown */}
          <div className="mt-4 block md:hidden">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Move Status</label>
            <select
              value={application.status}
              onChange={(e) => onStatusChange(application.id, e.target.value)}
              className="w-full rounded-lg border border-navy-750 bg-navy-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none transition"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3.5 border-t border-navy-850 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onView(application.id)}
                className="flex h-7 px-2.5 items-center justify-center gap-1 rounded bg-navy-800 text-[10px] font-bold text-slate-300 hover:bg-navy-700 hover:text-white border border-navy-750 transition"
              >
                <Eye className="h-3 w-3" />
                <span>View</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(application.id)}
                className="flex h-7 px-2.5 items-center justify-center gap-1 rounded bg-navy-800 text-[10px] font-bold text-slate-300 hover:bg-navy-700 hover:text-white border border-navy-750 transition"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDelete(application.id, application.company_name, application.role_title)}
              className="flex h-7 w-7 items-center justify-center rounded bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200 border border-rose-900/20 transition"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
