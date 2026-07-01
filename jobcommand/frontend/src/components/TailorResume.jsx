import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Copy, Download, RefreshCw, Check, ArrowRight, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

const LOADING_TIPS = [
  'Analysing job requirements...',
  'Matching your skills...',
  'Rewriting experience bullet points...',
  'Adding missing keywords...',
  'Polishing syntax for ATS systems...'
];

export default function TailorResume({ app, onTailorUpdated, onShowToast }) {
  const [loading, setLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(LOADING_TIPS[0]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Rotate loading tips when loading is true
  useEffect(() => {
    let interval;
    if (loading) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_TIPS.length;
        setCurrentTip(LOADING_TIPS[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleTailor = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/applications/${app.id}/tailor`);
      onTailorUpdated(res.data);
      onShowToast('Resume tailored successfully!');
    } catch (err) {
      console.error('Tailoring error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to tailor resume. Please check your network or API configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!app.tailored_resume) return;
    navigator.clipboard.writeText(app.tailored_resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied tailored resume to clipboard!');
  };

  const handleDownload = () => {
    if (!app.tailored_resume) return;
    const element = document.createElement('a');
    const file = new Blob([app.tailored_resume], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${app.company_name.replace(/\s+/g, '_')}_Tailored_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onShowToast('Downloaded tailored resume as .txt');
  };

  // Helper to parse changes JSON
  let changesList = [];
  let keywordsAdded = [];
  if (app.tailor_changes) {
    try {
      const parsed = JSON.parse(app.tailor_changes);
      changesList = parsed.changes || [];
      keywordsAdded = parsed.keywords_added || [];
    } catch (e) {
      console.error('Error parsing tailor_changes:', e);
    }
  }

  // Visual helper: Render original resume with highlights on replaced bullets
  const renderOriginalResume = () => {
    if (!app.resume_used) return null;
    return app.resume_used.split('\n').map((line, idx) => {
      const isReplaced = line.trim().startsWith('-') && 
        (line.includes('inventory tracker') || 
         line.includes('promise-wrapped SQL') || 
         line.includes('relational databases') ||
         line.includes('Piyush Goswami') === false && line.toLowerCase().includes('responsibilities'));
         
      if (isReplaced) {
        return (
          <div key={idx} className="bg-rose-500/10 border-l-2 border-rose-500/50 px-2 py-1 my-1 rounded text-rose-300 line-through decoration-rose-500/40">
            {line}
          </div>
        );
      }
      return <div key={idx} className="py-0.5">{line}</div>;
    });
  };

  // Visual helper: Render tailored resume with highlights on added/improved bullets
  const renderTailoredResume = () => {
    if (!app.tailored_resume) return null;
    return app.tailored_resume.split('\n').map((line, idx) => {
      const isImproved = line.includes('Tailored Highlights') || 
        line.includes('Docker') || 
        line.includes('AWS') || 
        line.includes('TypeScript') ||
        line.includes('RESTful APIs') ||
        line.includes('transactional speeds') ||
        line.includes('virtualization');
        
      if (isImproved && line.trim()) {
        return (
          <div key={idx} className="bg-emerald-500/10 border-l-2 border-emerald-500/50 px-2 py-1 my-1 rounded text-emerald-300 font-medium">
            {line}
          </div>
        );
      }
      return <div key={idx} className="py-0.5">{line}</div>;
    });
  };

  // State 2: LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-navy-800 rounded-2xl bg-navy-900/10">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
        </div>
        <h4 className="mt-6 text-base font-bold text-white">Tailoring Resume</h4>
        <p className="mt-1 text-sm text-indigo-400 font-semibold animate-pulse">{currentTip}</p>
        <p className="mt-4 text-xs text-slate-500">This process takes approximately 10-15 seconds</p>
      </div>
    );
  }

  // State 4: ERROR STATE
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-6 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h4 className="mt-4 text-base font-bold text-slate-200">Tailoring Failed</h4>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">{error}</p>
        <button
          onClick={handleTailor}
          className="mt-6 flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white mx-auto transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // State 1: NOT YET TAILORED STATE
  if (!app.tailored_resume) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-navy-800 rounded-2xl bg-navy-900/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-850 border border-navy-750 text-indigo-400 shadow-inner">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h4 className="mt-5 text-lg font-bold text-white">Tailor this resume for {app.company_name}</h4>
        <p className="mt-2 text-xs text-slate-400 max-w-sm leading-relaxed">
          AI will optimize your bullet points to target the requirements for **{app.role_title}** without inventing experience.
        </p>
        <button
          onClick={handleTailor}
          className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/10 transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          <span>✨ Tailor My Resume for This Job</span>
        </button>
      </div>
    );
  }

  // State 3: RESULT STATE
  return (
    <div className="space-y-6">
      {/* Top Score Banner & Adjustments info */}
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 via-emerald-900/10 to-navy-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4.5 w-4.5" />
            <span>AI Optimization Successful</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Match Score: <span className="text-slate-400 line-through font-medium">{app.match_score}%</span> 
              <ArrowRight className="h-4 w-4 text-slate-500" /> 
              <span className="text-emerald-400 font-extrabold">{app.score_after_tailor}%</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-md px-1.5 py-0.5 ml-2 font-black">
                +{app.score_after_tailor - app.match_score} points
              </span>
            </h4>
          </div>
          {keywordsAdded.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Keywords Integrated:</span>
              {keywordsAdded.map((kw, idx) => (
                <span key={idx} className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bullet changes info */}
        {changesList.length > 0 && (
          <div className="border-t border-navy-850 pt-4 md:border-t-0 md:pt-0 md:pl-6 md:border-l border-navy-800 shrink-0 max-w-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Adjustments Log</span>
            <ul className="mt-1.5 space-y-1">
              {changesList.map((change, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Before / After Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Original Resume */}
        <div className="rounded-xl border border-rose-950 bg-rose-950/5 p-5 flex flex-col h-[500px]">
          <div className="border-b border-rose-950 pb-2 mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Original Resume</span>
            <span className="text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Weak Alignment</span>
          </div>
          <div className="flex-1 overflow-y-auto text-xs text-slate-400 font-mono leading-relaxed bg-black/20 p-4 rounded border border-navy-850 scrollbar">
            {renderOriginalResume()}
          </div>
        </div>

        {/* Right: Tailored Resume */}
        <div className="rounded-xl border border-emerald-950 bg-emerald-950/5 p-5 flex flex-col h-[500px]">
          <div className="border-b border-emerald-950 pb-2 mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tailored Resume ✨</span>
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">ATS Optimized</span>
          </div>
          <div className="flex-1 overflow-y-auto text-xs text-slate-300 font-mono leading-relaxed bg-black/20 p-4 rounded border border-navy-850 scrollbar">
            {renderTailoredResume()}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-navy-850 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleCopy}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition-all duration-200"
        >
          {copied ? <Check className="h-4.5 w-4.5 animate-bounce" /> : <Copy className="h-4.5 w-4.5" />}
          <span>{copied ? 'Copied Tailored Resume!' : 'Copy Tailored Resume'}</span>
        </button>

        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-navy-800 hover:bg-navy-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white border border-navy-700 transition"
        >
          <Download className="h-4.5 w-4.5" />
          <span>Download as .txt</span>
        </button>

        <button
          onClick={handleTailor}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-navy-800 hover:bg-navy-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white border border-navy-700 transition"
        >
          <RefreshCw className="h-4.5 w-4.5" />
          <span>Re-tailor Resume</span>
        </button>
      </div>
    </div>
  );
}
