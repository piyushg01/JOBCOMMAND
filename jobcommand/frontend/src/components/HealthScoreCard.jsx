import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

export default function HealthScoreCard({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);
  const [error, setError] = useState(null);

  // Animation & Real-time change tracking
  const [animatedOffset, setAnimatedOffset] = useState(314.16); // Circumference for r=50 is 314.16
  const [prevScore, setPrevScore] = useState(null);
  const [scoreDiff, setScoreDiff] = useState(0);
  const [flashType, setFlashType] = useState(null); // 'up' | 'down' | null
  const [isPulsing, setIsPulsing] = useState(false);

  const fetchHealthScore = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoadingTips(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/dashboard/health-score`);
      const newScore = res.data.total_score;

      // Handle real-time flash and diff detection
      if (prevScore !== null && prevScore !== newScore) {
        const diff = newScore - prevScore;
        setScoreDiff(diff);
        setFlashType(diff > 0 ? 'up' : 'down');
        setIsPulsing(true);

        const timer = setTimeout(() => {
          setFlashType(null);
          setIsPulsing(false);
        }, 2000);
      }

      setData(res.data);
      setPrevScore(newScore);

      // SVG fill transition setup
      setTimeout(() => {
        const targetOffset = 314.16 - (newScore / 100) * 314.16;
        setAnimatedOffset(targetOffset);
      }, 100);

    } catch (err) {
      console.error('Error fetching search health score:', err);
      setError('Could not connect to health engine.');
    } finally {
      setLoading(false);
      setLoadingTips(false);
    }
  };

  // Re-fetch when parent updates (e.g. applications list modified)
  useEffect(() => {
    fetchHealthScore();
  }, [refreshTrigger]);

  const handleManualRefresh = () => {
    fetchHealthScore(true);
  };

  const getStrokeColor = (grade) => {
    switch (grade) {
      case 'Exceptional': return '#10B981'; // emerald
      case 'Strong': return '#22C55E';      // green
      case 'Good': return '#3B82F6';        // blue
      case 'Needs Work': return '#F59E0B';  // yellow/amber
      case 'Critical': return '#EF4444';    // red
      default: return '#64748B';            // gray
    }
  };

  const getGradeBgClass = (grade) => {
    switch (grade) {
      case 'Exceptional': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Strong': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'Good': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Needs Work': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getBarColor = (score, max) => {
    const pct = (score / max) * 100;
    if (pct > 75) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Custom tooltips for line chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-950 border border-navy-800 rounded-lg p-2.5 text-[10px] font-bold shadow-xl">
          <p className="text-slate-400">{payload[0].payload.date}</p>
          <p className="text-blue-400 mt-0.5">Health Score: {payload[0].value}/100</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-lg mb-8 animate-pulse">
        <div className="flex items-center justify-between border-b border-navy-850 pb-4 mb-6">
          <div className="h-5 w-48 bg-navy-800 rounded"></div>
          <div className="h-8 w-8 bg-navy-800 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 flex flex-col items-center justify-center border-r border-navy-850/60 pr-0 lg:pr-6">
            <div className="h-32 w-32 rounded-full border-4 border-navy-800 border-t-transparent animate-spin"></div>
            <div className="h-4 w-28 bg-navy-800 rounded mt-4"></div>
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-3 w-full bg-navy-800 rounded"></div>
            <div className="h-3 w-11/12 bg-navy-800 rounded"></div>
            <div className="h-3 w-10/12 bg-navy-800 rounded"></div>
            <div className="h-3 w-full bg-navy-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-lg mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <span className="text-sm font-semibold text-slate-300">{error}</span>
        </div>
        <button
          onClick={() => fetchHealthScore()}
          className="rounded-lg bg-navy-800 border border-navy-750 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle case with 0 applications
  if (!data || data.total_score === 0) {
    return (
      <div className="rounded-2xl border border-navy-800 bg-navy-900 p-8 shadow-lg mb-8 text-center flex flex-col items-center justify-center">
        {/* Gray Circle with "?" */}
        <div className="relative h-28 w-28 flex items-center justify-center rounded-full border-4 border-slate-700 bg-navy-950 mb-4 select-none">
          <span className="text-4xl font-extrabold text-slate-500">?</span>
        </div>
        <h3 className="text-base font-bold text-slate-200">Track Search Health Score</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Add your first application to see your health score and get personalized career coaching tips.
        </p>
      </div>
    );
  }

  const { total_score, grade, grade_color, factors, weakest_factor, all_tips, history } = data;

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 shadow-lg mb-8 overflow-hidden p-6 ${
      flashType === 'up' 
        ? 'border-emerald-500/30 bg-emerald-950/20 ring-2 ring-emerald-500/10' 
        : flashType === 'down'
        ? 'border-rose-500/30 bg-rose-950/20 ring-2 ring-rose-500/10'
        : 'border-navy-800 bg-navy-900'
    }`}>
      {/* Real-time floating change badge */}
      {flashType && (
        <div className={`absolute top-6 right-16 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black shadow-lg animate-bounce z-20 ${
          flashType === 'up' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {flashType === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          <span>{scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} points</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-850/60 pb-4 mb-6">
        <div>
          <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
            📊 Job Search Health Score
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Calculated in real-time based on pipeline efficiency</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={loadingTips}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-white border border-navy-750 transition"
          title="Recalculate Health & Tips"
        >
          <RefreshCw className={`h-4 w-4 ${loadingTips ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main circular display and trend chart */}
        <div className="lg:col-span-5 flex flex-col md:flex-row lg:flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-navy-850/60 pb-6 lg:pb-0 pr-0 lg:pr-6 gap-6">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`relative h-32 w-32 flex items-center justify-center transition-transform duration-300 ${
              isPulsing ? 'scale-105 animate-pulse' : ''
            }`}>
              {/* Circular SVG */}
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke="#1E293B"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke={getStrokeColor(grade)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="314.16"
                  style={{
                    transition: 'stroke-dashoffset 1.5s ease-out',
                    strokeDashoffset: animatedOffset,
                    strokeLinecap: 'round'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-3xl font-extrabold text-white tracking-tighter leading-none">{total_score}</span>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mt-0.5">out of 100</span>
              </div>
            </div>
            
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-black select-none tracking-wide ${getGradeBgClass(grade)}`}>
              {grade === 'Exceptional' && '🚀 '}
              {grade === 'Strong' && '💪 '}
              {grade === 'Good' && '📈 '}
              {grade === 'Needs Work' && '⚠️ '}
              {grade === 'Critical' && '🔴 '}
              {grade}
            </div>
          </div>

          {/* Score history line chart */}
          {history && history.length > 0 && (
            <div className="flex-1 w-full min-w-[200px] flex flex-col items-center lg:items-stretch select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Score Trend</span>
              <div className="h-24 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height={96}>
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={getStrokeColor(grade)} 
                      strokeWidth={2} 
                      dot={{ r: 3, strokeWidth: 1 }} 
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Factors Breakdown and AI Tips */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          {/* Factors List */}
          <div className="space-y-4">
            {Object.entries(factors).map(([key, f]) => {
              const pct = (f.score / f.max) * 100;
              const isWeakest = key === weakest_factor;
              return (
                <div key={key} className="group relative space-y-1">
                  {/* Tooltip detail element */}
                  <div className="hidden group-hover:block absolute bg-navy-950 border border-navy-800 rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-300 z-30 -top-8 left-0 shadow-xl pointer-events-none transition-all border-l-2 border-l-blue-500">
                    {f.detail}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold text-slate-300 flex items-center gap-1.5`}>
                      {f.label}
                      {isWeakest && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" title="Weakest area"></span>
                      )}
                    </span>
                    <span className="font-bold text-slate-400">
                      {f.score}<span className="text-slate-600 text-[10px]">/{f.max}</span>
                    </span>
                  </div>

                  {/* Horizontal progress meter bar */}
                  <div className="w-full h-2 rounded-full bg-navy-950 border border-navy-850 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getBarColor(f.score, f.max)}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Career tips */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none"></div>
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2 select-none uppercase tracking-wide">
              <span>💡 AI Tips for This Week</span>
              {loadingTips && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>}
            </h4>

            {loadingTips ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-3 w-11/12 bg-navy-800 rounded"></div>
                <div className="h-3 w-10/12 bg-navy-800 rounded"></div>
                <div className="h-3 w-full bg-navy-800 rounded"></div>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {all_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
