import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Copy, Check, CheckCircle2, ShieldCheck, Mail, Calendar } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

// Sub-component: Individual Follow-up Card
function FollowUpCard({ app, onMarkDone, onShowToast }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get(`${API_BASE}/applications/${app.id}/followup`);
        setMsg(res.data.content);
      } catch (err) {
        console.error('Error fetching followup for card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessage();
  }, [app.id]);

  const handleCopy = () => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied follow-up email template!');
  };

  return (
    <div className="rounded-xl border border-navy-850 bg-gradient-to-b from-navy-900 to-navy-950 p-6 shadow-md relative overflow-hidden transition-all duration-200 hover:border-navy-800">
      {/* Visual Indicator of alert priority based on age */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        app.days_since >= 14 ? 'bg-rose-500' : 'bg-amber-500'
      }`}></div>

      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-navy-850 pb-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{app.company_name}</h3>
          <p className="text-sm text-slate-400 font-semibold mt-0.5">{app.role_title}</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Applied: {new Date(app.application_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
              Waiting {app.days_since} days
            </span>
          </div>
        </div>

        <button
          onClick={() => onMarkDone(app.id, app.company_name)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Mark as Done</span>
        </button>
      </div>

      {/* Message preview */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          <span>AI-Drafted Polite Follow-up</span>
        </div>
        
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-slate-500 text-xs italic">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <span>Drafting custom message...</span>
          </div>
        ) : msg ? (
          <div className="rounded-lg bg-navy-950/60 p-4 border border-navy-850 max-h-40 overflow-y-auto relative group">
            <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed select-all">
              {msg}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 p-1.5 rounded-md bg-navy-900 border border-navy-800 text-slate-400 hover:text-white transition duration-200"
              title="Copy Message"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">Failed to load email draft.</p>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function Followups({ triggerUpdateFollowups }) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/followups`);
      setFollowups(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching followups:', err);
      setError('Failed to load pending followups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleMarkDone = async (id, companyName) => {
    try {
      await axios.post(`${API_BASE}/applications/${id}/mark-followed-up`);
      showToast(`Followed up with ${companyName}`);
      fetchFollowups(); // reload list
      triggerUpdateFollowups(); // update sidebar badge count
    } catch (err) {
      console.error('Mark as done error:', err);
      showToast('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400 font-medium">Scanning for applications needing follow-ups...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-lg">
          <h3 className="text-lg font-semibold text-slate-200">Load Error</h3>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 w-full max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed right-8 top-20 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/80 px-4 py-3 shadow-xl backdrop-blur-md text-emerald-200 animate-slide-in">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 border-b border-navy-800 pb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Follow-up Command</h2>
        <p className="text-sm text-slate-400 mt-1">Applications in "Applied" status with no updates in the last 7+ days</p>
      </div>

      {followups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-navy-800 rounded-2xl bg-navy-900/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-950 border border-emerald-900 text-emerald-400 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h4 className="mt-4 text-base font-semibold text-slate-200">All caught up!</h4>
          <p className="mt-2 text-sm text-slate-400 max-w-md">
            No applications are currently pending follow-up (applied 7+ days ago with status "Applied"). Fantastic work tracking your pipeline!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {followups.map((app) => (
            <FollowUpCard 
              key={app.id} 
              app={app} 
              onMarkDone={handleMarkDone} 
              onShowToast={showToast} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
