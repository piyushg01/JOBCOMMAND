# 🚀 JobCommand AI
### AI-Powered Job Application Management Platform built with Lemma SDK

> **Ship to Get Hired – Gappy AI Hackathon 2026 Submission**

An intelligent job application management platform that helps job seekers organize applications, optimize resumes, prepare for interviews, generate outreach messages, monitor job search health, and automate follow-ups using AI Agents powered by **Lemma SDK**.

---

# 📌 Problem Statement

Job seekers often apply to dozens or even hundreds of companies simultaneously.

Managing resumes, tracking applications, preparing interviews, sending follow-ups, and tailoring resumes manually becomes overwhelming.

Most existing job trackers only store information.

**JobCommand actually helps users complete the work using AI.**

---

# 💡 Solution

JobCommand combines AI Agents, AI Functions, Workflows, Datastores and a modern dashboard into one intelligent platform.

Instead of simply storing applications, JobCommand can:

- Match resumes with job descriptions
- Tailor resumes automatically
- Generate recruiter outreach messages
- Coach interview preparation
- Monitor application health
- Organize applications visually
- Track follow-ups automatically

---

# ✨ Features

## 📊 Smart Dashboard

- Application statistics
- Active applications
- Interview pipeline
- Health Score
- Pending Follow-ups
- Kanban board

---

## 📄 Resume Matcher Agent

Automatically:

- Finds the best resume
- Compares with Job Description
- Calculates ATS Match Score
- Detects missing skills
- Suggests improvements

Example Output

```
Match Score: 85%

Matched Skills
✔ React
✔ Node.js
✔ TypeScript
✔ AWS
✔ SQL
✔ Redis

Missing Skills
• Ruby

Suggestion
Add Ruby experience to improve ATS score.
```

---

## 📝 Resume Tailor Agent

Generates an improved resume specifically for a selected job description.

---

## 📧 Outreach Drafter

Creates recruiter outreach emails automatically.

Example

- Cold outreach
- Follow-up email
- Thank-you email

---

## 🎤 Interview Coach

Generates:

- Technical Questions
- HR Questions
- Behavioral Questions
- Suggested Answers
- Interview Tips

---

## ❤️ Health Coach

Monitors job search progress.

Provides:

- AI Health Score
- Burnout Detection
- Motivation Tips
- Daily Suggestions

---

## 📌 Kanban Job Tracker

Applications move across:

```
Applied
↓

Assessment
↓

Interview

↓

Offer

↓

Rejected
```

Supports drag-and-drop.

---

## 🔄 Automated Workflows

Included workflows:

- New Application
- Interview Pipeline
- Follow-up Reminder

---

# 🤖 AI Agents

| Agent | Purpose |
|---------|----------|
| Resume Matcher | Resume ATS analysis |
| Resume Tailor | Tailor resume |
| Interview Coach | Interview preparation |
| Outreach Drafter | Email generation |
| Health Coach | Job search wellness |
| Scout | Finds opportunities |
| Triage | Organizes tasks |
| Chaser | Follow-up automation |

---

# ⚙ AI Functions

- match_resume
- tailor_resume
- draft_outreach
- coach_interview
- calculate_health

---

# 🗄 Datastores

- Applications
- Resumes
- Messages
- Health History
- Interview Notes

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- Recharts
- React Router

---

## Backend

- Node.js
- Express
- SQLite
- REST API

---

## AI Infrastructure

- Lemma SDK
- Lemma Agents
- Lemma Functions
- Lemma Workflows
- Lemma Datastores

---

## AI Models

- OpenAI GPT-4o
- Groq Llama 3.3 70B
- Custom Rule-based Matching

---

# 📂 Project Structure

```
jobcommand/

│
├── frontend/
│
├── backend/
│
├── agents/
│   ├── resume-matcher
│   ├── resume-tailor
│   ├── interview-coach
│   ├── outreach-drafter
│   ├── health-coach
│   ├── scout
│   ├── triage
│   └── chaser
│
├── functions/
│   ├── match_resume
│   ├── tailor_resume
│   ├── coach_interview
│   ├── draft_outreach
│   └── calculate_health
│
├── tables/
│
├── workflows/
│
└── pod.json
```

---

# 🚀 Running Locally

## Start Lemma

```bash
lemma up
```

---

## Verify

```bash
docker ps

lemma auth status

lemma function list

lemma agent list
```

---

## Backend

```bash
cd jobcommand/backend

node server.js
```

Server

```
http://localhost:3000
```

---

## Frontend

```bash
cd jobcommand/frontend

npm install

npm run dev
```

Open

```
http://localhost:5173
```

---

# 🧪 Example AI Function

```bash
lemma function run match_resume \
--data '{
"resume_id":"fedc5ef2-4f34-4a79-8412-bb32a04487ec",
"application_id":"01cd00f7-eb54-46a4-828d-26e053edc500"
}'
```

Example Output

```
Match Score : 85

Matched Skills

React

Node.js

TypeScript

AWS

SQL

Redis

Missing Skill

Ruby
```

---

# 📸 Demo

Demo Video

(Add Drive Link)

---

Live Product

(Add Lemma Pod Link)

---

# 🎯 Hackathon Highlights

✔ Built entirely using Lemma SDK

✔ AI Agents

✔ AI Functions

✔ Datastores

✔ Workflows

✔ Frontend Dashboard

✔ Backend REST APIs

✔ Resume Intelligence

✔ ATS Matching

✔ Interview Coaching

✔ Outreach Automation

✔ Health Monitoring

---

# 🔥 Future Improvements

- Gmail Integration
- LinkedIn Integration
- Calendar Scheduling
- Multi-user Authentication
- AI Career Recommendation Engine
- Resume Version Control
- Company Analytics
- Job Recommendation System
- Voice Interview Practice
- Browser Extension

---

# 👨‍💻 Developed By

**Piyush Dineshgir Goswami**

Computer Science Engineering (AI & ML)

Ship to Get Hired — Gappy AI Hackathon 2026

GitHub

https://github.com/piyushg01

---

# 🙏 Acknowledgements

Special thanks to

- Lemma SDK Team
- Gappy AI
- Ship to Get Hired Hackathon

for providing an incredible AI infrastructure to build agentic applications.

---

⭐ If you found this project interesting, please consider giving it a star.
