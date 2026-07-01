-- JobCommand SQLite Schema

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  application_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Applied', 'Screening', 'Interview', 'Offer', 'Rejected')),
  resume_used TEXT NOT NULL,
  match_score INTEGER DEFAULT 0,
  analysis_json TEXT, -- Stores JSON: { matched_skills, missing_skills, suggestions }
  notes TEXT,
  followed_up INTEGER DEFAULT 0, -- 0 for false, 1 for true
  tailored_resume TEXT, -- Stores full tailored resume text
  tailor_changes TEXT, -- Stores JSON array string of changes description
  score_after_tailor INTEGER, -- Match score after tailoring
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('outreach', 'follow_up')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prep_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  questions TEXT NOT NULL, -- JSON string representing the 10 questions
  company_summary TEXT NOT NULL,
  talking_points TEXT NOT NULL, -- JSON string representing the 5 talking points
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
