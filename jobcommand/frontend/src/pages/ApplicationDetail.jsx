import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  FileText,
  Send,
  HelpCircle,
  Clock,
  CheckSquare,
  Edit,
  Building,
  Sparkles
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MatchScore from '../components/MatchScore';
import TailorResume from '../components/TailorResume';

const API_BASE = 'http://localhost:3000/api';

export default function ApplicationDetail({ triggerUpdateFollowups }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // App core data
  const [app, setApp] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [errorApp, setErrorApp] = useState(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState('gap'); // 'gap', 'outreach', 'prep', 'followup'

  // Tab 2: Outreach Message State
  const [outreach, setOutreach] = useState('');
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [copiedOutreach, setCopiedOutreach] = useState(false);

  // Tab 3: Interview Prep State
  const [prep, setPrep] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);

  // Tab 4: Follow Up State
  const [followup, setFollowup] = useState('');
  const [loadingFollowup, setLoadingFollowup] = useState(false);
  const [copiedFollowup, setCopiedFollowup] = useState(false);

  // Page level toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchApplicationDetails = async () => {
    setLoadingApp(true);
    try {
      const response = await axios.get(`${API_BASE}/applications/${id}`);
      setApp(response.data);
      if (response.data.analysis_json) {
        setAnalysis(JSON.parse(response.data.analysis_json));
      }
      setErrorApp(null);
    } catch (err) {
      console.error('Error fetching application:', err);
      setErrorApp('Failed to load application details.');
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  // Lazy load tab data based on active tab
  useEffect(() => {
    if (!app) return;
    
    if (activeTab === 'outreach' && !outreach) {
      fetchOutreach();
    } else if (activeTab === 'prep' && !prep) {
      fetchPrep();
    } else if (activeTab === 'followup' && !followup) {
      fetchFollowup();
    }
  }, [activeTab, app]);

  // Tab 1: Re-analyze
  const handleReanalyze = async () => {
    setLoadingApp(true);
    try {
      const res = await axios.post(`${API_BASE}/applications/${id}/reanalyze`);
      showToast('Resume analysis updated successfully!');
      fetchApplicationDetails(); // reload core details
    } catch (err) {
      console.error('Re-analyze error:', err);
      showToast(err.response?.data?.error || 'Failed to re-analyze resume.', 'error');
      setLoadingApp(false);
    }
  };

  // Tab 2: Outreach API
  const fetchOutreach = async () => {
    setLoadingOutreach(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/${id}/outreach`);
      setOutreach(res.data.content);
    } catch (err) {
      console.error('Fetch outreach error:', err);
      showToast('Failed to load outreach message.', 'error');
    } finally {
      setLoadingOutreach(false);
    }
  };

  const regenerateOutreach = async () => {
    setLoadingOutreach(true);
    try {
      const res = await axios.post(`${API_BASE}/applications/${id}/outreach`);
      setOutreach(res.data.content);
      showToast('Outreach message regenerated!');
    } catch (err) {
      console.error('Regenerate outreach error:', err);
      showToast(err.response?.data?.error || 'Failed to regenerate outreach.', 'error');
    } finally {
      setLoadingOutreach(false);
    }
  };

  // Tab 3: Prep API
  const fetchPrep = async () => {
    setLoadingPrep(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/${id}/prep`);
      setPrep(res.data);
    } catch (err) {
      console.error('Fetch prep error:', err);
      showToast('Failed to load interview prep notes.', 'error');
    } finally {
      setLoadingPrep(false);
    }
  };

  const regeneratePrep = async () => {
    setLoadingPrep(true);
    try {
      const res = await axios.post(`${API_BASE}/applications/${id}/prep`);
      setPrep(res.data);
      showToast('Interview prep notes regenerated!');
    } catch (err) {
      console.error('Regenerate prep error:', err);
      showToast(err.response?.data?.error || 'Failed to regenerate prep notes.', 'error');
    } finally {
      setLoadingPrep(false);
    }
  };

  // Tab 4: Follow Up API
  const fetchFollowup = async () => {
    setLoadingFollowup(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/${id}/followup`);
      setFollowup(res.data.content);
    } catch (err) {
      console.error('Fetch followup error:', err);
      showToast('Failed to load follow-up email.', 'error');
    } finally {
      setLoadingFollowup(false);
    }
  };

  const regenerateFollowup = async () => {
    setLoadingFollowup(true);
    try {
      const res = await axios.post(`${API_BASE}/applications/${id}/followup`);
      setFollowup(res.data.content);
      showToast('Follow-up email regenerated!');
    } catch (err) {
      console.error('Regenerate followup error:', err);
      showToast(err.response?.data?.error || 'Failed to regenerate follow-up.', 'error');
    } finally {
      setLoadingFollowup(false);
    }
  };

  const handleMarkFollowedUp = async () => {
    try {
      await axios.post(`${API_BASE}/applications/${id}/mark-followed-up`);
      showToast('Application marked as followed up!');
      fetchApplicationDetails(); // reload core details to update date/status
      triggerUpdateFollowups(); // update sidebar badge count
    } catch (err) {
      console.error('Mark followed up error:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Clipboard copies
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'outreach') {
      setCopiedOutreach(true);
      setTimeout(() => setCopiedOutreach(false), 2000);
    } else if (type === 'followup') {
      setCopiedFollowup(true);
      setTimeout(() => setCopiedFollowup(false), 2000);
    }
    showToast('Copied content to clipboard!');
  };

  if (loadingApp && !app) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400 font-medium">Retrieving database logs & AI templates...</span>
        </div>
      </div>
    );
  }

  if (errorApp || !app) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-200">Load Error</h3>
          <p className="mt-2 text-sm text-slate-400">{errorApp || 'Application not found.'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-6 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 transition border border-navy-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 w-full max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-8 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${
          toast.type === 'error' 
            ? 'border-red-500/20 bg-red-950/80 text-red-200' 
            : 'border-emerald-500/20 bg-emerald-950/80 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation & Edit */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Command Centre</span>
        </button>

        <Link
          to={`/application/${id}/edit`}
          className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-navy-700 hover:text-white transition"
        >
          <Edit className="h-3.5 w-3.5" />
          <span>Edit Application Info</span>
        </Link>
      </div>

      {/* Main Stats Header Banner */}
      <div className="rounded-2xl border border-navy-800 bg-gradient-to-r from-navy-900 to-navy-950 p-6 md:p-8 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative subtle ambient lights */}
        <div className="absolute right-0 top-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 h-28 w-28 bg-indigo-500/5 rounded-full blur-3xl"></div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 border border-navy-700 text-blue-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-none">{app.company_name}</h2>
              <p className="text-sm text-slate-400 mt-1 font-semibold">{app.role_title}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-500" />
              Applied: {new Date(app.application_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span className="h-1 w-1 rounded-full bg-navy-700"></span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              {app.days_since} days since application
            </span>
            <span className="h-1 w-1 rounded-full bg-navy-700"></span>
            <StatusBadge status={app.status} />
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-navy-800 pt-4 md:border-t-0 md:pt-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resume Match Score</span>
            <p className="text-xs text-slate-400 mt-0.5">Weighted analysis vs Job Description</p>
          </div>
          <MatchScore score={app.match_score} size="lg" />
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-navy-850 mb-6 overflow-x-auto gap-2">
        {[
        { id: 'gap', label: 'Resume Gap Analysis', icon: FileText },
        { id: 'outreach', label: 'Outreach Message', icon: Send },
        { id: 'prep', label: 'Interview Prep', icon: HelpCircle },
        { id: 'followup', label: 'Follow Up', icon: Clock },
        { id: 'tailor', label: 'Tailor Resume', icon: Sparkles }
      ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-navy-700'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {/* TAB 1: Resume Gap Analysis */}
        {activeTab === 'gap' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-navy-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Required Skills vs Resume Alignment</h3>
                <p className="text-xs text-slate-400">Match score is calculated by cross-referencing experiences, qualifications, and technologies</p>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={loadingApp}
                className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingApp ? 'animate-spin' : ''}`} />
                <span>Re-analyse</span>
              </button>
            </div>

            {analysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills columns */}
                <div className="space-y-6">
                  {/* Matched skills card */}
                  <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Matched Skills ({analysis.matched_skills?.length || 0})
                    </h4>
                    {analysis.matched_skills && analysis.matched_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.matched_skills.map((skill, idx) => (
                          <span key={idx} className="rounded-md bg-emerald-500/5 border border-emerald-500/25 px-2.5 py-1 text-xs font-medium text-emerald-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No exact matching keywords found in resume</p>
                    )}
                  </div>

                  {/* Missing skills card */}
                  <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      Missing Skills in Resume ({analysis.missing_skills?.length || 0})
                    </h4>
                    {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.missing_skills.map((skill, idx) => (
                          <span key={idx} className="rounded-md bg-rose-500/5 border border-rose-500/25 px-2.5 py-1 text-xs font-medium text-rose-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-400 italic">Perfect skills match! No missing skills identified.</p>
                    )}
                  </div>
                </div>

                {/* Suggestions column */}
                <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Suggested Resume Action Plan
                  </h4>
                  {analysis.suggestions && analysis.suggestions.length > 0 ? (
                    <ul className="space-y-3.5">
                      {analysis.suggestions.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No recommendations. Resume looks optimized for this JD!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl border border-dashed border-navy-800">
                <p className="text-sm text-slate-500 italic">No analysis data. Click "Re-analyse" to prompt the AI.</p>
              </div>
            )}
            
            {/* Notes Section */}
            {app.notes && (
              <div className="mt-8 rounded-xl border border-navy-800 bg-navy-950 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Personal Notes</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{app.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Outreach Message */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-navy-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">AI outreach draft</h3>
                <p className="text-xs text-slate-400">A personalized, concise template reference customized with your resume strengths and matching job requirements</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={regenerateOutreach}
                  disabled={loadingOutreach}
                  className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingOutreach ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                {outreach && (
                  <button
                    onClick={() => copyToClipboard(outreach, 'outreach')}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all"
                  >
                    {copiedOutreach ? <Check className="h-3.5 w-3.5 animate-bounce" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedOutreach ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                )}
              </div>
            </div>

            {loadingOutreach ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-xs text-slate-400 font-medium">Drafting cold outreach template...</p>
              </div>
            ) : outreach ? (
              <div className="rounded-xl border border-navy-800 bg-navy-900/40 p-6 shadow-inner relative group">
                <pre className="text-sm text-slate-200 font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {outreach}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-navy-800 rounded-xl">
                <p className="text-xs text-slate-500 italic">Failed to load outreach message.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Interview Prep */}
        {activeTab === 'prep' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-navy-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Interview Coaching Notes</h3>
                <p className="text-xs text-slate-400">AI-suggested company overview, critical resume talking points, and top 10 likely interview questions</p>
              </div>
              <button
                onClick={regeneratePrep}
                disabled={loadingPrep}
                className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingPrep ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>

            {loadingPrep ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-xs text-slate-400 font-medium">Assembling interview coach briefing...</p>
              </div>
            ) : prep ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Summary & Talking points */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Company Summary */}
                  <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2.5">
                      Company & Role Context
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {prep.company_summary}
                    </p>
                  </div>

                  {/* Talking points */}
                  <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
                      Resume Talking Points to Highlight
                    </h4>
                    {prep.talking_points && prep.talking_points.length > 0 ? (
                      <ul className="space-y-3">
                        {prep.talking_points.map((point, idx) => (
                          <li key={idx} className="text-xs text-slate-300 leading-relaxed flex gap-2 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific talking points found.</p>
                    )}
                  </div>
                </div>

                {/* Right side: Questions */}
                <div className="lg:col-span-7 rounded-xl border border-navy-800 bg-navy-900/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Top 10 Likely Interview Questions
                  </h4>
                  {prep.questions && prep.questions.length > 0 ? (
                    <div className="space-y-3.5">
                      {prep.questions.map((question, idx) => (
                        <div key={idx} className="flex gap-3 items-start border-b border-navy-850 pb-2.5 last:border-0 last:pb-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-navy-800 border border-navy-700 text-[10px] font-bold text-slate-400">
                            Q{idx + 1}
                          </span>
                          <p className="text-xs text-slate-200 font-semibold leading-relaxed pt-0.5">
                            {question}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No questions generated.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-navy-800 rounded-xl">
                <p className="text-xs text-slate-500 italic">Failed to load prep notes.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Follow Up */}
        {activeTab === 'followup' && (
          <div className="space-y-6">
            {/* Alert banner if condition met: status Applied and days since >= 7 */}
            {app.status === 'Applied' && app.days_since >= 7 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex items-center gap-3 shadow-md shadow-amber-500/5 animate-pulse">
                <AlertTriangle className="h-5.5 w-5.5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Time to follow up!</h4>
                  <p className="text-xs text-slate-400 mt-0.5">It has been {app.days_since} days since you applied without a recorded response. Reach out using the AI template below.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-navy-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Follow-up Template</h3>
                <p className="text-xs text-slate-400">A polite, professional reminder email summarizing your continued interest</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {app.followed_up === 0 && (
                  <button
                    onClick={handleMarkFollowedUp}
                    className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Mark as Followed Up</span>
                  </button>
                )}
                {app.followed_up === 1 && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Followed Up Recorded</span>
                  </span>
                )}
                <button
                  onClick={regenerateFollowup}
                  disabled={loadingFollowup}
                  className="flex items-center gap-2 rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingFollowup ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                {followup && (
                  <button
                    onClick={() => copyToClipboard(followup, 'followup')}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all"
                  >
                    {copiedFollowup ? <Check className="h-3.5 w-3.5 animate-bounce" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedFollowup ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                )}
              </div>
            </div>

            {loadingFollowup ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-3 text-xs text-slate-400 font-medium">Generating follow-up template...</p>
              </div>
            ) : followup ? (
              <div className="rounded-xl border border-navy-800 bg-navy-900/40 p-6 shadow-inner relative">
                <pre className="text-sm text-slate-200 font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {followup}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-navy-800 rounded-xl">
                <p className="text-xs text-slate-500 italic">Failed to load follow-up template.</p>
              </div>
            )}
          </div>
        )}

      {/* TAB 5: Tailor Resume */}
      {activeTab === 'tailor' && (
        <div className="space-y-6">
          {!app.resume_used || !app.resume_used.trim() ? (
            <div className="text-center py-12 border border-dashed border-navy-800 rounded-xl bg-navy-900/10">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <h4 className="mt-4 text-base font-bold text-slate-200">No Resume Found</h4>
              <p className="mt-2 text-xs text-slate-400">Please add your resume in Edit Application first.</p>
              <Link
                to={`/application/${id}/edit`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy-850 hover:bg-navy-800 px-4 py-2 text-xs font-semibold text-slate-300 transition border border-navy-700"
              >
                <Edit className="h-3.5 w-3.5 text-slate-400" />
                <span className="ml-1">Go to Edit Application</span>
              </Link>
            </div>
          ) : (
            <TailorResume 
              app={app} 
              onTailorUpdated={(tailoredData) => {
                setApp(prev => ({
                  ...prev,
                  tailored_resume: tailoredData.tailored_resume,
                  tailor_changes: JSON.stringify({
                    changes: tailoredData.changes,
                    keywords_added: tailoredData.keywords_added
                  }),
                  score_after_tailor: tailoredData.score_after
                }));
              }} 
              onShowToast={(msg, type) => showToast(msg, type)}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
