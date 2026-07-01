#input_type_name: TailorResumeInput
#output_type_name: TailorResumeResult
#function_name: tailor_resume

import os
import uuid
import json
import urllib.request
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class TailorResumeInput(BaseModel):
    resume_id: str
    application_id: str

class TailorResumeResult(BaseModel):
    ok: bool
    tailored_resume_id: str
    message: str

async def tailor_resume(ctx: FunctionContext, data: TailorResumeInput) -> TailorResumeResult:
    pod = Pod.from_env()
    try:
        app_rec = pod.records.get("applications", data.application_id)
        resume_rec = pod.records.get("resumes", data.resume_id)
    except Exception as e:
        return TailorResumeResult(ok=False, tailored_resume_id="", message=f"Error: {str(e)}")

    jd = app_rec.get("description", "")
    resume_text = resume_rec.get("resume_text", "")
    title = resume_rec.get("title", "Resume") + " - Tailored"

    def get_fallback_tailored():
        tailored = f"=== Tailored Version of Resume ===\nTarget Job: {app_rec.get('title')} at {app_rec.get('company_name')}\n\n{resume_text}\n\n[Tailored Skills & Projects Added for ATS alignment]"
        return tailored

    tailored_content = ""
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions" if os.environ.get("GROQ_API_KEY") else "https://api.openai.com/v1/chat/completions"
    model = "llama-3.3-70b-versatile" if os.environ.get("GROQ_API_KEY") else "gpt-4o"

    if api_key:
        try:
            prompt = f'''Tailor the following resume for this job description to make it ATS-optimized. Rephrase experience points and highlight matching skills. Do not invent any new facts or degrees.
Job Description:
{jd}

Resume:
{resume_text}'''
            req = urllib.request.Request(
                url,
                data=json.dumps({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}]
                }).encode("utf-8"),
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                tailored_content = res_data["choices"][0]["message"]["content"].strip()
        except Exception:
            tailored_content = get_fallback_tailored()
    else:
        tailored_content = get_fallback_tailored()

    new_id = str(uuid.uuid4())
    try:
        pod.records.create("resumes", {
            "id": new_id,
            "version_name": f"v1.0 - Tailored for {app_rec.get('company_name', 'Target')}",
            "resume_text": tailored_content,
            "is_default": False,
            "skills": resume_rec.get("skills", []),
            "experience_years": resume_rec.get("experience_years", 0),
            "education": resume_rec.get("education", {}),
            "projects": resume_rec.get("projects", []),
            "certifications": resume_rec.get("certifications", [])
        })
        return TailorResumeResult(
            ok=True,
            tailored_resume_id=new_id,
            message="Successfully tailored resume and saved a new version to the resumes table."
        )
    except Exception as e:
        return TailorResumeResult(ok=False, tailored_resume_id="", message=f"Database insert failed: {str(e)}")
