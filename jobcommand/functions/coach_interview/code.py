#input_type_name: CoachInterviewInput
#output_type_name: CoachInterviewResult
#function_name: coach_interview

import os
import uuid
import json
import urllib.request
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class CoachInterviewInput(BaseModel):
    resume_id: str
    application_id: str
    interview_type: str = "Technical"

class CoachInterviewResult(BaseModel):
    ok: bool
    prep_note_id: str
    company_overview: str
    key_resume_highlights: list[str]
    coaching_tips: list[str]

async def coach_interview(ctx: FunctionContext, data: CoachInterviewInput) -> CoachInterviewResult:
    pod = Pod.from_env()
    try:
        app_rec = pod.records.get("applications", data.application_id)
        resume_rec = pod.records.get("resumes", data.resume_id)
    except Exception as e:
        return CoachInterviewResult(
            ok=False, prep_note_id="", company_overview=f"Error: {str(e)}",
            key_resume_highlights=[], coaching_tips=[]
        )

    company = app_rec.get("company_name", "the company")
    role = app_rec.get("title", "Software Engineer")
    jd = app_rec.get("description", "")
    resume = resume_rec.get("resume_text", "")

    def get_fallback_prep():
        return {
            "company_overview": f"{company} is a leading player in its industry, currently recruiting for a {role} to join their growing engineering division.",
            "highlights": ["Possesses strong alignment with core tech stack requirements.", "Demonstrated history of delivering full-stack solutions."],
            "tips": ["Brush up on core database design concepts.", "Be prepared to walk through your system design projects."]
        }

    prep = {}
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions" if os.environ.get("GROQ_API_KEY") else "https://api.openai.com/v1/chat/completions"
    model = "llama-3.3-70b-versatile" if os.environ.get("GROQ_API_KEY") else "gpt-4o"

    if api_key:
        try:
            prompt = f'''Generate interview coaching prep for a candidate applying to {company} as a {role} ({data.interview_type} interview). Return ONLY a JSON object with keys:
"company_overview" (string, 2-3 sentences), "highlights" (array of 3-5 strings of candidate strengths), "tips" (array of 3-5 custom tips/questions).

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
                prep = json.loads(res_data["choices"][0]["message"]["content"].strip())
        except Exception:
            prep = get_fallback_prep()
    else:
        prep = get_fallback_prep()

    new_id = str(uuid.uuid4())
    try:
        pod.records.create("prep_notes", {
            "id": new_id,
            "application_id": data.application_id,
            "company_overview": prep.get("company_overview", ""),
            "key_highlights": prep.get("highlights", []),
            "study_questions": prep.get("tips", [])
        })
        return CoachInterviewResult(
            ok=True,
            prep_note_id=new_id,
            company_overview=prep.get("company_overview", ""),
            key_resume_highlights=prep.get("highlights", []),
            coaching_tips=prep.get("tips", [])
        )
    except Exception as e:
        return CoachInterviewResult(
            ok=False, prep_note_id="", company_overview=f"Database insert failed: {str(e)}",
            key_resume_highlights=[], coaching_tips=[]
        )
