# JobCommand — AI Job Application Command Centre

JobCommand is a full-stack dashboard designed to help job seekers coordinate and optimize their job applications. By leveraging AI (OpenAI GPT-4o), JobCommand evaluates resumes against job descriptions, identifies skill gaps, drafts personalized cold outreach letters, structures interview study sheets, and schedules follow-up emails.

---

## Folder Structure

```
/jobcommand
  /frontend
    /src
      /pages
        Dashboard.jsx
        AddApplication.jsx
        ApplicationDetail.jsx
        EditApplication.jsx
        Followups.jsx
      /components
        Sidebar.jsx
        Navbar.jsx
        StatusBadge.jsx
        MatchScore.jsx
        LoadingSpinner.jsx
      App.jsx
      main.jsx
    package.json
    tailwind.config.js
    postcss.config.js
  /backend
    /routes
      applications.js
      ai.js
    /db
      database.js
      schema.sql
    server.js
    package.json
  .env
  README.md
```

---

## Setup & Installation

### Prerequisite
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 1. Configure Environment Variables
In the root `/jobcommand` folder, locate or create the `.env` file and fill in your OpenAI API Key:
```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install and Start the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   *Note: The SQLite database file (`job_command.db`) and table structure are created automatically on launch.*

### 3. Install and Start the Frontend
1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Click the link shown in your terminal (usually `http://localhost:5173`) to open the app.

---

## Demo & Verification Flow

1. **Launch**: Boot up the backend and frontend. Connect to `http://localhost:5173`.
2. **Add Job**: Navigate to `Add Application`. Enter a company name, role title, copy-paste a sample job description, and your resume. Submit the form.
3. **Analyze Score**: Watch the loading indicator as the AI evaluates alignment. You will be redirected to the **Resume Gap Analysis** detail view showing your match score (color-coded) along with matched skills, missing skills, and clear resume formatting recommendations.
4. **Recruiter Outreach**: Navigate to the `Outreach Message` tab on the application details page. The app automatically drafts a cold message highlighting shared skills.
5. **Interview Prep**: Select the `Interview Prep` tab to access a 2-3 sentence company overview, 5 resume highlight points, and a list of 10 customized interview questions.
6. **Polite Follow-up**: If your job is older than 7 days, a header alert warns you to check-in. The `Follow Up` tab contains a pre-drafted follow-up email. Click "Mark as Followed Up" once sent.
7. **Pipeline Command**: Check the `Dashboard` for counts across pipelines, or visit the `Follow-ups` tab in the sidebar to review all applications waiting for follow-ups at once!
