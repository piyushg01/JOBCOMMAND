const express = require('express');
const router = express.Router();
const db = require('../db/database');
const {
  generateMatchScore,
  generateOutreach,
  generateInterviewPrep,
  generateFollowUp,
  generateTailoredResume
} = require('./ai');

// Helper: Format date as YYYY-MM-DD
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/applications - List all applications
router.get('/', async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM applications ORDER BY application_date DESC, id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// GET /api/applications/stats - Dashboard counts
router.get('/stats', async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT status, COUNT(*) as count FROM applications GROUP BY status');
    const stats = {
      total: 0,
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0
    };
    rows.forEach(row => {
      stats[row.status] = row.count;
      stats.total += row.count;
    });
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics.' });
  }
});

// GET /api/applications/followups - Pending follow-ups
// Rule: Status is "Applied", days since applied >= 7, and followed_up = 0
router.get('/followups', async (req, res) => {
  try {
    const query = `
      SELECT *, 
      CAST(julianday('now') - julianday(application_date) AS INTEGER) as days_since
      FROM applications 
      WHERE status = 'Applied' 
        AND (julianday('now') - julianday(application_date)) >= 7 
        AND followed_up = 0
      ORDER BY application_date ASC
    `;
    const rows = await db.allAsync(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups.' });
  }
});

// GET /api/applications/:id - Detailed view (without pre-generating AI content to prevent long hangs)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const application = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    
    // Calculate days since applied
    const daysSinceQuery = `SELECT CAST(julianday('now') - julianday(application_date) AS INTEGER) as days_since FROM applications WHERE id = ?`;
    const dateInfo = await db.getAsync(daysSinceQuery, [id]);
    application.days_since = dateInfo ? dateInfo.days_since : 0;

    res.json(application);
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: 'Failed to fetch application details.' });
  }
});

// POST /api/applications - Add new application
router.post('/', async (req, res) => {
  const {
    company_name,
    role_title,
    job_description,
    resume_used,
    application_date,
    status,
    notes
  } = req.body;

  if (!company_name || !role_title || !job_description || !resume_used) {
    return res.status(400).json({ error: 'Company Name, Role, Job Description, and Resume are required.' });
  }

  const appDate = application_date || getTodayDateString();
  const appStatus = status || 'Applied';

  try {
    // 1. Automatically call AI for score & gap analysis
    let score = 0;
    let analysis_json = null;
    try {
      const analysis = await generateMatchScore(job_description, resume_used);
      score = analysis.score;
      analysis_json = JSON.stringify(analysis);
    } catch (aiError) {
      console.error('AI Match Analysis on creation failed:', aiError);
      // We still want to let user save the job even if AI fails, but let's notify.
      // Alternatively, we can let the save fail if API key is invalid. 
      // To meet the requirement "All AI features must actually call the API and return real responses", 
      // we throw the error if the user hasn't set up the API key so they immediately see what is wrong.
      throw new Error(`AI Analysis Failed: ${aiError.message}. Please check your environment configuration/API key.`);
    }

    // 2. Save application to DB
    const insertQuery = `
      INSERT INTO applications (
        company_name, role_title, job_description, application_date, status, resume_used, match_score, analysis_json, notes, followed_up
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const result = await db.runAsync(insertQuery, [
      company_name,
      role_title,
      job_description,
      appDate,
      appStatus,
      resume_used,
      score,
      analysis_json,
      notes || ''
    ]);

    const newApp = await db.getAsync('SELECT * FROM applications WHERE id = ?', [result.id]);
    res.status(201).json(newApp);
  } catch (error) {
    console.error('Error adding application:', error);
    res.status(500).json({ error: error.message || 'Failed to create application.' });
  }
});

// PUT /api/applications/:id - Edit application
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    company_name,
    role_title,
    job_description,
    resume_used,
    application_date,
    status,
    notes
  } = req.body;

  if (!company_name || !role_title || !job_description || !resume_used) {
    return res.status(400).json({ error: 'Company Name, Role, Job Description, and Resume are required.' });
  }

  try {
    const existing = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Re-calculate match score if JD or resume changed
    let score = existing.match_score;
    let analysis_json = existing.analysis_json;
    if (existing.job_description !== job_description || existing.resume_used !== resume_used) {
      try {
        const analysis = await generateMatchScore(job_description, resume_used);
        score = analysis.score;
        analysis_json = JSON.stringify(analysis);
      } catch (aiError) {
        console.error('AI Match Analysis on update failed:', aiError);
        throw new Error(`AI Analysis Failed: ${aiError.message}`);
      }
    }

    const updateQuery = `
      UPDATE applications 
      SET company_name = ?, 
          role_title = ?, 
          job_description = ?, 
          application_date = ?, 
          status = ?, 
          resume_used = ?, 
          match_score = ?, 
          analysis_json = ?, 
          notes = ?
      WHERE id = ?
    `;
    await db.runAsync(updateQuery, [
      company_name,
      role_title,
      job_description,
      application_date,
      status,
      resume_used,
      score,
      analysis_json,
      notes || '',
      id
    ]);

    const updatedApp = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    res.json(updatedApp);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: error.message || 'Failed to update application.' });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await db.runAsync('DELETE FROM applications WHERE id = ?', [id]);
    res.json({ message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// POST /api/applications/:id/mark-followed-up - Mark followed up
router.post('/:id/mark-followed-up', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await db.runAsync('UPDATE applications SET followed_up = 1 WHERE id = ?', [id]);
    res.json({ message: 'Application marked as followed up.' });
  } catch (error) {
    console.error('Error marking as followed up:', error);
    res.status(500).json({ error: 'Failed to update follow-up status.' });
  }
});

// POST /api/applications/:id/reanalyze - Re-run resume gap analysis
router.post('/:id/reanalyze', async (req, res) => {
  const { id } = req.params;
  try {
    const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const analysis = await generateMatchScore(app.job_description, app.resume_used);
    const analysis_json = JSON.stringify(analysis);

    await db.runAsync('UPDATE applications SET match_score = ?, analysis_json = ? WHERE id = ?', [
      analysis.score,
      analysis_json,
      id
    ]);

    res.json({ score: analysis.score, ...analysis });
  } catch (error) {
    console.error('Error re-analyzing application:', error);
    res.status(500).json({ error: error.message || 'Failed to re-analyze.' });
  }
});

// GET /api/applications/:id/outreach - Load outreach message, generate if not exists
router.get('/:id/outreach', async (req, res) => {
  const { id } = req.params;
  try {
    let msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'outreach'", [id]);
    if (!msg) {
      const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
      if (!app) return res.status(404).json({ error: 'Application not found.' });

      const content = await generateOutreach(app.company_name, app.role_title, app.job_description, app.resume_used);
      await db.runAsync("INSERT INTO messages (application_id, type, content) VALUES (?, 'outreach', ?)", [id, content]);
      msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'outreach'", [id]);
    }
    res.json(msg);
  } catch (error) {
    console.error('Error fetching outreach message:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch outreach message.' });
  }
});

// POST /api/applications/:id/outreach - Regenerate outreach message
router.post('/:id/outreach', async (req, res) => {
  const { id } = req.params;
  try {
    const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const content = await generateOutreach(app.company_name, app.role_title, app.job_description, app.resume_used);
    
    // Check if exists
    const msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'outreach'", [id]);
    if (msg) {
      await db.runAsync("UPDATE messages SET content = ? WHERE id = ?", [content, msg.id]);
    } else {
      await db.runAsync("INSERT INTO messages (application_id, type, content) VALUES (?, 'outreach', ?)", [id, content]);
    }

    res.json({ content });
  } catch (error) {
    console.error('Error regenerating outreach message:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate outreach message.' });
  }
});

// GET /api/applications/:id/prep - Load prep notes, generate if not exists
router.get('/:id/prep', async (req, res) => {
  const { id } = req.params;
  try {
    let prep = await db.getAsync('SELECT * FROM prep_notes WHERE application_id = ?', [id]);
    if (!prep) {
      const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
      if (!app) return res.status(404).json({ error: 'Application not found.' });

      const aiPrep = await generateInterviewPrep(app.company_name, app.role_title, app.job_description, app.resume_used);
      await db.runAsync(
        'INSERT INTO prep_notes (application_id, questions, company_summary, talking_points) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(aiPrep.questions), aiPrep.company_summary, JSON.stringify(aiPrep.talking_points)]
      );
      prep = await db.getAsync('SELECT * FROM prep_notes WHERE application_id = ?', [id]);
    }

    // Parse JSON arrays for response
    res.json({
      id: prep.id,
      application_id: prep.application_id,
      questions: JSON.parse(prep.questions),
      company_summary: prep.company_summary,
      talking_points: JSON.parse(prep.talking_points),
      created_at: prep.created_at
    });
  } catch (error) {
    console.error('Error fetching interview prep:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch interview prep.' });
  }
});

// POST /api/applications/:id/prep - Regenerate prep notes
router.post('/:id/prep', async (req, res) => {
  const { id } = req.params;
  try {
    const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const aiPrep = await generateInterviewPrep(app.company_name, app.role_title, app.job_description, app.resume_used);
    
    const prep = await db.getAsync('SELECT * FROM prep_notes WHERE application_id = ?', [id]);
    if (prep) {
      await db.runAsync(
        'UPDATE prep_notes SET questions = ?, company_summary = ?, talking_points = ? WHERE id = ?',
        [JSON.stringify(aiPrep.questions), aiPrep.company_summary, JSON.stringify(aiPrep.talking_points), prep.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO prep_notes (application_id, questions, company_summary, talking_points) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(aiPrep.questions), aiPrep.company_summary, JSON.stringify(aiPrep.talking_points)]
      );
    }

    res.json(aiPrep);
  } catch (error) {
    console.error('Error regenerating interview prep:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate interview prep.' });
  }
});

// GET /api/applications/:id/followup - Load followup message, generate if not exists
router.get('/:id/followup', async (req, res) => {
  const { id } = req.params;
  try {
    let msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'follow_up'", [id]);
    if (!msg) {
      const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
      if (!app) return res.status(404).json({ error: 'Application not found.' });

      const content = await generateFollowUp(app.company_name, app.role_title, app.application_date);
      await db.runAsync("INSERT INTO messages (application_id, type, content) VALUES (?, 'follow_up', ?)", [id, content]);
      msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'follow_up'", [id]);
    }
    res.json(msg);
  } catch (error) {
    console.error('Error fetching follow-up message:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch follow-up message.' });
  }
});

// POST /api/applications/:id/followup - Regenerate followup message
router.post('/:id/followup', async (req, res) => {
  const { id } = req.params;
  try {
    const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const content = await generateFollowUp(app.company_name, app.role_title, app.application_date);
    
    const msg = await db.getAsync("SELECT * FROM messages WHERE application_id = ? AND type = 'follow_up'", [id]);
    if (msg) {
      await db.runAsync("UPDATE messages SET content = ? WHERE id = ?", [content, msg.id]);
    } else {
      await db.runAsync("INSERT INTO messages (application_id, type, content) VALUES (?, 'follow_up', ?)", [id, content]);
    }

    res.json({ content });
  } catch (error) {
    console.error('Error regenerating follow-up message:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate follow-up message.' });
  }
});

// POST /api/applications/:id/tailor - Generate and save tailored resume
router.post('/:id/tailor', async (req, res) => {
  const { id } = req.params;
  try {
    const app = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (!app.resume_used || !app.resume_used.trim()) {
      return res.status(400).json({ error: 'Please add your resume in Edit Application first.' });
    }

    const result = await generateTailoredResume(
      app.job_description,
      app.resume_used,
      app.company_name,
      app.role_title
    );

    // Save to DB
    const updateQuery = `
      UPDATE applications 
      SET tailored_resume = ?, 
          tailor_changes = ?, 
          score_after_tailor = ? 
      WHERE id = ?
    `;
    
    const tailorChangesObj = {
      changes: result.changes,
      keywords_added: result.keywords_added
    };

    await db.runAsync(updateQuery, [
      result.tailored_resume,
      JSON.stringify(tailorChangesObj),
      result.score_after,
      id
    ]);

    res.json({
      tailored_resume: result.tailored_resume,
      changes: result.changes,
      keywords_added: result.keywords_added,
      score_before: result.score_before || app.match_score,
      score_after: result.score_after
    });
  } catch (error) {
    console.error('Error tailoring resume for application:', error);
    res.status(500).json({ error: error.message || 'Failed to tailor resume.' });
  }
});

// PATCH /api/applications/:id/status - Update application status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const existing = await db.getAsync('SELECT * FROM applications WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await db.runAsync('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
    
    res.json({
      success: true,
      id: parseInt(id),
      status
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

module.exports = router;
