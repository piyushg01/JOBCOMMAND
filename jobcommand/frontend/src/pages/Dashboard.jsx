import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, Pencil, Trash2, Plus, Briefcase, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MatchScore from '../components/MatchScore';
import ViewToggle from '../components/ViewToggle';
import KanbanBoard from '../components/KanbanBoard';
import HealthScoreCard from '../components/HealthScoreCard';

const API_BASE = 'http://localhost:3000/api';

export default function Dashboard({ triggerUpdateFollowups }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    Applied: 0,
    Screening: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem('jobcommand_view_preference') || 'table');
  
  // Toast notifications state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        axios.get(`${API_BASE}/applications/stats`),
        axios.get(`${API_BASE}/applications`)
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to connect to backend server. Ensure it is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, companyName, roleTitle) => {
    if (!window.confirm(`Are you sure you want to delete the application for ${roleTitle} at ${companyName}?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/applications/${id}`);
      showToast(`Successfully deleted ${roleTitle} at ${companyName}`);
      fetchData();
      triggerUpdateFollowups();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete application', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400 font-medium">Loading command centre...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-lg">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-200">Connection Error</h3>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button 
            onClick={fetchData} 
            className="mt-6 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tracked', value: stats.total, color: 'from-blue-600/10 to-indigo-600/10 border-slate-800 text-slate-200' },
    { label: 'Applied', value: stats.Applied, color: 'from-blue-600/10 to-blue-500/10 border-blue-500/25 text-blue-400' },
    { label: 'Screening', value: stats.Screening, color: 'from-amber-600/10 to-amber-500/10 border-amber-500/25 text-amber-400' },
    { label: 'Interviewing', value: stats.Interview, color: 'from-purple-600/10 to-purple-500/10 border-purple-500/25 text-purple-400' },
    { label: 'Offers', value: stats.Offer, color: 'from-emerald-600/10 to-emerald-500/10 border-emerald-500/25 text-emerald-400' },
    { label: 'Rejected', value: stats.Rejected, color: 'from-rose-600/10 to-rose-500/10 border-rose-500/25 text-rose-400' }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed right-8 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
          toast.type === 'error' 
            ? 'border-red-500/20 bg-red-950/80 text-red-200' 
            : 'border-emerald-500/20 bg-emerald-950/80 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 1. HealthScoreCard (NEW - full width) */}
      <HealthScoreCard refreshTrigger={applications} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-navy-850 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {view === 'kanban' ? 'Job Application Pipeline' : 'Applications Dashboard'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {view === 'kanban' 
              ? 'Track your journey from applied to offer' 
              : 'Manage and coordinate your active job application pipelines'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <ViewToggle currentView={view} onViewChange={setView} />
          <Link 
            to="/add"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-blue-500 hover:to-indigo-500 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Application</span>
          </Link>
        </div>
      </div>

      {/* 2. Stats Section */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className={`rounded-xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-200 hover:translate-y-[-2px] ${card.color}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</span>
            <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 4. Table View OR Kanban View */}
      {applications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 bg-navy-900 border border-navy-800 rounded-xl">
          <div className="text-6xl mb-4 select-none">📭</div>
          <h4 className="mt-4 text-base font-bold text-slate-200">No applications yet</h4>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Add your first job application to start tracking
          </p>
          <Link 
            to="/add" 
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/10 transition-all"
          >
            Add Application →
          </Link>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex-1 overflow-hidden h-[calc(100vh-28rem)] min-h-[500px]">
          <KanbanBoard
            applications={applications}
            onView={(id) => navigate(`/application/${id}`)}
            onEdit={(id) => navigate(`/application/${id}/edit`)}
            onDelete={handleDelete}
            onStatusChanged={fetchData}
          />
        </div>
      ) : (
        /* Applications Table */
        <div className="rounded-xl border border-navy-800 bg-navy-900 shadow-md">
          <div className="border-b border-navy-800 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">Active Applications</h3>
            <span className="text-xs text-slate-400 font-medium">{applications.length} total entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead className="bg-navy-950/60 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-navy-800">
                <tr>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Role Title</th>
                  <th className="px-6 py-4">Date Applied</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Match Score</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-navy-850/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{app.company_name}</td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{app.role_title}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(app.application_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <MatchScore score={app.match_score} size="sm" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => navigate(`/application/${app.id}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-white border border-navy-750 transition-all"
                          title="View Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/application/${app.id}/edit`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-white border border-navy-750 transition-all"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id, app.company_name, app.role_title)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-200 border border-red-900/30 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
