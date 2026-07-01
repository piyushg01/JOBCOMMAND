import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Briefcase, FileText, Calendar, Info } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE = 'http://localhost:3000/api';

export default function AddApplication({ triggerUpdateFollowups }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    job_description: '',
    resume_used: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.role_title.trim() || !formData.job_description.trim() || !formData.resume_used.trim()) {
      setError('Please fill in all required fields (Company, Role, Job Description, and Resume).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/applications`, formData);
      triggerUpdateFollowups();
      // Redirect to detail page of newly created application
      navigate(`/application/${response.data.id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to save application. Verify your environment config/API key and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 max-w-4xl mx-auto w-full">
      {loading && <LoadingSpinner message="Evaluating resume against job description & generating match score..." />}

      {/* Breadcrumb */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* Header */}
      <div className="mb-8 border-b border-navy-800 pb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Add New Job Application</h2>
        <p className="text-sm text-slate-400 mt-1">Paste the job details and your resume to launch the AI comparison engine</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          <p className="font-semibold">Submission failed</p>
          <p className="mt-1 text-slate-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. Google, Stripe, Vercel"
                className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Role Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="role_title"
              value={formData.role_title}
              onChange={handleChange}
              placeholder="e.g. Software Engineer, Product Manager"
              className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
              required
            />
          </div>
        </div>

        {/* Date & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Date Applied
            </label>
            <div className="relative">
              <input
                type="date"
                name="application_date"
                value={formData.application_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Current Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Job Description <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-slate-500">Paste full job listing text</span>
          </div>
          <textarea
            name="job_description"
            value={formData.job_description}
            onChange={handleChange}
            placeholder="Paste the entire job description text here, including requirements, responsibilities, and benefits..."
            rows={6}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition font-sans"
            required
          />
        </div>

        {/* Resume Textarea */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Resume Content <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-slate-500">Paste plain text of your resume</span>
          </div>
          <textarea
            name="resume_used"
            value={formData.resume_used}
            onChange={handleChange}
            placeholder="Paste the plain text of the resume you applied with (skills, experiences, education)..."
            rows={6}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition font-sans"
            required
          />
        </div>

        {/* Optional Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any personal follow-up dates, interviewer names, or referral info..."
            rows={3}
            className="w-full rounded-lg border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-navy-850 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 hover:from-blue-500 hover:to-indigo-500 hover:shadow-indigo-500/20 transition-all duration-200"
          >
            <Save className="h-4.5 w-4.5" />
            <span>Create and Run AI Analysis</span>
          </button>
        </div>
      </form>
    </div>
  );
}
