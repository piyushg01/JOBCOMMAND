#input_type_name: DraftOutreachInput
#output_type_name: DraftOutreachResult
#function_name: draft_outreach

import os
import uuid
import json
import urllib.request
from datetime import datetime
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class DraftOutreachInput(BaseModel):
    resume_id: str
    application_id: str
    message_type: str = "Outreach"

class DraftOutreachResult(BaseModel):
    ok: bool
    draft_message_id: str
    message_body: str

async def draft_outreach(ctx: FunctionContext, data: DraftOutreachInput) -> DraftOutreachResult:
    pod = Pod.from_env()
    try:
        app_rec = pod.records.get("applications", data.application_id)
        resume_rec = pod.records.get("resumes", data.resume_id)
    except Exception as e:
        return DraftOutreachResult(ok=False, draft_message_id="", message_body=f"Error: {str(e)}")

    company = app_rec.get("company_name", "the company")
    role = app_rec.get("title", "Software Engineer")
    jd = app_rec.get("description", "")
    resume = resume_rec.get("resume_text", "")

    def get_fallback_outreach():
        return f"Subject: Application for {role} at {company}\n\nDear Recruiting Team,\n\nI am writing to express my interest in the {role} position. Based on my experience with matching technologies, I believe I would be a great fit.\n\nBest regards,\nCandidate"

    draft = ""
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions" if os.environ.get("GROQ_API_KEY") else "https://api.openai.com/v1/chat/completions"
    model = "llama-3.3-70b-versatile" if os.environ.get("GROQ_API_KEY") else "gpt-4o"

    if api_key:
        try:
            prompt = f"Write a professional recruiter outreach or follow-up message of type {data.message_type} for a candidate applying to {company} as a {role}.\nJob Description:\n{jd}\nCandidate Resume:\n{resume}"
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
                draft = res_data["choices"][0]["message"]["content"].strip()
        except Exception:
            draft = get_fallback_outreach()
    else:
        draft = get_fallback_outreach()

    # Standardize message_type to lowercase to match enum options
    m_type = data.message_type.lower()
    if m_type not in ["outreach", "follow_up", "thank_you", "recruiter_reply", "custom"]:
        m_type = "outreach"

    new_id = str(uuid.uuid4())
    try:
        pod.records.create("messages", {
            "id": new_id,
            "application_id": data.application_id,
            "message_type": m_type,
            "subject": f"Application for {role} at {company}",
            "content": draft,
            "status": "open",
            "channel": "email",
            "tone": "professional",
            "ai_generated": True
        })
        return DraftOutreachResult(
            ok=True,
            draft_message_id=new_id,
            message_body=draft
        )
    except Exception as e:
        return DraftOutreachResult(ok=False, draft_message_id="", message_body=f"Database insert failed: {str(e)}")
