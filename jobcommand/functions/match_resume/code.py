#input_type_name: MatchResumeInput
#output_type_name: MatchResumeResult
#function_name: match_resume

import os
import json
import urllib.request
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class MatchResumeInput(BaseModel):
    resume_id: str
    application_id: str

class MatchResumeResult(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]

async def match_resume(ctx: FunctionContext, data: MatchResumeInput) -> MatchResumeResult:
    pod = Pod.from_env()
    try:
        app_rec = pod.records.get("applications", data.application_id)
        resume_rec = pod.records.get("resumes", data.resume_id)
    except Exception as e:
        return MatchResumeResult(
            match_score=0,
            matched_skills=[],
            missing_skills=[],
            suggestions=[f"Error fetching records: {str(e)}"]
        )

    jd = app_rec.get("job_description", "") or app_rec.get("role_title", "")
    resume = resume_rec.get("resume_text", "") or resume_rec.get("title", "")

    def get_fallback():
        jd_lower = jd.lower()
        resume_lower = resume.lower()
        all_skills = ["react", "node.js", "typescript", "postgresql", "aws", "docker", "express.js", "redux", "rest apis", "terraform", "agile", "python", "sql", "pytorch", "tensorflow", "scikit-learn", "xgboost", "pandas", "numpy", "snowflake", "mongodb", "jira", "confluence", "kubernetes", "gcp", "helm", "jenkins", "gitlab ci", "github actions", "bash", "go", "tailwind css", "figma", "git", "npm", "vite", "webpack", "ruby", "redis"]
        matched = []
        missing = []
        for s in all_skills:
            if s in jd_lower:
                if s in resume_lower:
                    matched.append(s.title())
                else:
                    missing.append(s.title())
        total = len(matched) + len(missing)
        score = int((len(matched) / total * 100)) if total > 0 else 75
        suggestions = [f"Add {m} experience to your resume." for m in missing[:3]]
        return MatchResumeResult(
            match_score=score,
            matched_skills=matched,
            missing_skills=missing,
            suggestions=suggestions
        )

    api_key = os.environ.get("GROQ_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions"
    model = "llama-3.3-70b-versatile"
    if not api_key:
        api_key = os.environ.get("OPENAI_API_KEY")
        url = "https://api.openai.com/v1/chat/completions"
        model = "gpt-4o"

    if not api_key:
        return get_fallback()

    try:
        prompt = f'''Compare this job description and resume. Return ONLY a JSON object with keys:
"score" (0-100 integer), "matched_skills" (array of strings), "missing_skills" (array of strings), "suggestions" (array of specific improvements).

Job Description:
{jd}

Resume:
{resume}'''
        req = urllib.request.Request(
            url,
            data=json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }).encode("utf-8"),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["choices"][0]["message"]["content"].strip()
            res_json = json.loads(content)
            return MatchResumeResult(
                match_score=int(res_json.get("score", 75)),
                matched_skills=res_json.get("matched_skills", []),
                missing_skills=res_json.get("missing_skills", []),
                suggestions=res_json.get("suggestions", [])
            )
    except Exception:
        return get_fallback()
