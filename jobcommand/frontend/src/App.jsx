import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import EditApplication from './pages/EditApplication';
import Followups from './pages/Followups';

const API_BASE = 'http://localhost:3000/api';

export default function App() {
  const [followupsCount, setFollowupsCount] = useState(0);

  const fetchFollowupsCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/applications/followups`);
      setFollowupsCount(res.data.length);
    } catch (err) {
      console.error('Error fetching follow-ups count for sidebar:', err);
    }
  };

  useEffect(() => {
    fetchFollowupsCount();
  }, []);

  const triggerUpdateFollowups = () => {
    fetchFollowupsCount();
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-navy-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar pendingFollowupsCount={followupsCount} />

        {/* Content Wrapper */}
        <main className="flex flex-1 flex-col overflow-hidden bg-navy-900/40 relative">
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard triggerUpdateFollowups={triggerUpdateFollowups} />} 
            />
            <Route 
              path="/add" 
              element={<AddApplication triggerUpdateFollowups={triggerUpdateFollowups} />} 
            />
            <Route 
              path="/application/:id" 
              element={<ApplicationDetail triggerUpdateFollowups={triggerUpdateFollowups} />} 
            />
            <Route 
              path="/application/:id/edit" 
              element={<EditApplication triggerUpdateFollowups={triggerUpdateFollowups} />} 
            />
            <Route 
              path="/followups" 
              element={<Followups triggerUpdateFollowups={triggerUpdateFollowups} />} 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
