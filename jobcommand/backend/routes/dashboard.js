const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateHealthSearchTips } = require('./ai');

// GET /api/dashboard/health-score
router.get('/health-score', async (req, res) => {
  try {
    // 1. Get all applications
    const apps = await db.allAsync('SELECT * FROM applications');

    if (apps.length === 0) {
      return res.json({
        total_score: 0,
        grade: "Critical",
        grade_color: "red",
        factors: {
          activity: { score: 0, max: 20, label: "Weekly Activity", detail: "0 applications this week" },
          match_quality: { score: 0, max: 25, label: "Match Quality", detail: "Average match score: 0" },
          followup: { score: 20, max: 20, label: "Follow-up Rate", detail: "0 pending follow-ups" },
          diversity: { score: 5, max: 20, label: "Pipeline Diversity", detail: "0 stages active" },
          conversion: { score: 0, max: 15, label: "Interview Rate", detail: "0% reached interview" }
        },
        weakest_factor: "activity",
        ai_tip: "Add your first application to see your health score and get personalized tips.",
        all_tips: [
          "Add your first application to begin tracking details.",
          "Fill in your resume to unlock gap analyses and matching insights.",
          "Keep target job descriptions handy to measure role matches."
        ],
        history: []
      });
    }

    // FACTOR 1: Activity Score (20 points max)
    // Count applications from last 7 days
    const weeklyApps = await db.allAsync(
      "SELECT * FROM applications WHERE application_date >= date('now', '-7 days')"
    );
    const weeklyCount = weeklyApps.length;
    let activityScore = 0;
    if (weeklyCount >= 5) activityScore = 20;
    else if (weeklyCount >= 3) activityScore = 15;
    else if (weeklyCount >= 1) activityScore = 10;
    else activityScore = 0;

    // FACTOR 2: Match Quality Score (25 points max)
    const totalMatchScore = apps.reduce((sum, app) => sum + (app.match_score || 0), 0);
    const avgMatchScore = Math.round(totalMatchScore / apps.length);
    let matchQualityScore = 0;
    if (avgMatchScore > 75) matchQualityScore = 25;
    else if (avgMatchScore >= 60 && avgMatchScore <= 75) matchQualityScore = 18;
    else if (avgMatchScore >= 45 && avgMatchScore < 60) matchQualityScore = 10;
    else matchQualityScore = 5;

    // FACTOR 3: Follow-up Score (20 points max)
    const pendingFollowupsRows = await db.allAsync(`
      SELECT COUNT(*) as count FROM applications 
      WHERE status = 'Applied' 
        AND (julianday('now') - julianday(application_date)) >= 7 
        AND followed_up = 0
    `);
    const pendingCount = pendingFollowupsRows[0].count;
    let followupScore = 0;
    if (pendingCount === 0) followupScore = 20;
    else if (pendingCount === 1 || pendingCount === 2) followupScore = 15;
    else if (pendingCount === 3 || pendingCount === 4) followupScore = 8;
    else followupScore = 0;

    // FACTOR 4: Pipeline Diversity Score (20 points max)
    const stages = new Set(apps.map(app => app.status));
    const activeStagesCount = stages.size;
    let diversityScore = 0;
    if (activeStagesCount >= 3) diversityScore = 20;
    else if (activeStagesCount === 2) diversityScore = 12;
    else diversityScore = 5;

    // FACTOR 5: Interview Conversion Score (15 points max)
    const interviewCount = apps.filter(app => app.status === 'Interview' || app.status === 'Offer').length;
    const interviewRate = Math.round((interviewCount / apps.length) * 100);
    let conversionScore = 0;
    if (interviewRate >= 30) conversionScore = 15;
    else if (interviewRate >= 15 && interviewRate < 30) conversionScore = 10;
    else if (interviewRate >= 5 && interviewRate < 15) conversionScore = 5;
    else conversionScore = 0;

    // Total Score
    const totalScore = activityScore + matchQualityScore + followupScore + diversityScore + conversionScore;

    // Grade
    let grade = "Critical";
    let gradeColor = "red";
    if (totalScore >= 90) {
      grade = "Exceptional";
      gradeColor = "emerald";
    } else if (totalScore >= 75) {
      grade = "Strong";
      gradeColor = "green";
    } else if (totalScore >= 60) {
      grade = "Good";
      gradeColor = "blue";
    } else if (totalScore >= 45) {
      grade = "Needs Work";
      gradeColor = "yellow";
    }

    // Identify weakest factor
    const factorScores = [
      { key: "activity", score: activityScore, max: 20 },
      { key: "match_quality", score: matchQualityScore, max: 25 },
      { key: "followup", score: followupScore, max: 20 },
      { key: "diversity", score: diversityScore, max: 20 },
      { key: "conversion", score: conversionScore, max: 15 }
    ];
    let weakestFactor = "activity";
    let minPct = 1.1;
    factorScores.forEach(f => {
      const pct = f.score / f.max;
      if (pct < minPct) {
        minPct = pct;
        weakestFactor = f.key;
      }
    });

    // Save calculation to health_score_history
    await db.runAsync('INSERT INTO health_score_history (score) VALUES (?)', [totalScore]);

    // Generate AI tips
    const statsForTips = {
      count: weeklyCount,
      avg: avgMatchScore,
      pending: pendingCount,
      stages: activeStagesCount,
      rate: interviewRate,
      total: totalScore,
      weakest_factor: weakestFactor
    };

    const allTips = await generateHealthSearchTips(statsForTips);
    const aiTip = allTips[0] || "Consider applying to more relevant roles.";

    // Get last 7 records for history trend graph
    const historyRows = await db.allAsync(
      'SELECT id, score, calculated_at FROM health_score_history ORDER BY calculated_at DESC LIMIT 7'
    );
    const history = historyRows.reverse().map(row => ({
      score: row.score,
      date: new Date(row.calculated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

    res.json({
      total_score: totalScore,
      grade,
      grade_color: gradeColor,
      factors: {
        activity: {
          score: activityScore,
          max: 20,
          label: "Weekly Activity",
          detail: `${weeklyCount} application${weeklyCount === 1 ? '' : 's'} this week`
        },
        match_quality: {
          score: matchQualityScore,
          max: 25,
          label: "Match Quality",
          detail: `Average match score: ${avgMatchScore}`
        },
        followup: {
          score: followupScore,
          max: 20,
          label: "Follow-up Rate",
          detail: `${pendingCount} pending follow-up${pendingCount === 1 ? '' : 's'}`
        },
        diversity: {
          score: diversityScore,
          max: 20,
          label: "Pipeline Diversity",
          detail: `Applications in ${activeStagesCount} stage${activeStagesCount === 1 ? '' : 's'}`
        },
        conversion: {
          score: conversionScore,
          max: 15,
          label: "Interview Rate",
          detail: `${interviewRate}% reached interview`
        }
      },
      weakest_factor: weakestFactor,
      ai_tip: aiTip,
      all_tips: allTips,
      history
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ error: 'Failed to calculate health score.' });
  }
});

module.exports = router;
