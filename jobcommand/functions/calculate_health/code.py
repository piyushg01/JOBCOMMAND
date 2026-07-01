#input_type_name: CalculateHealthInput
#output_type_name: CalculateHealthResult
#function_name: calculate_health

import os
import uuid
from datetime import datetime
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class CalculateHealthInput(BaseModel):
    pass

class CalculateHealthResult(BaseModel):
    overall_score: int
    active_applications_count: int
    response_rate: float
    ai_tips: list[str]

async def calculate_health(ctx: FunctionContext, data: CalculateHealthInput) -> CalculateHealthResult:
    pod = Pod.from_env()
    try:
        apps = pod.records.list("applications", limit=200).items
    except Exception as e:
        return CalculateHealthResult(overall_score=0, active_applications_count=0, response_rate=0.0, ai_tips=[f"Error: {str(e)}"])

    total_apps = len(apps)
    active_states = {"applied", "interviewing", "offer"}
    active_apps = [a for a in apps if a.to_dict().get("status", "").lower() in active_states]
    active_count = len(active_apps)
    
    interviewing_count = len([a for a in apps if a.to_dict().get("status", "").lower() == "interviewing"])
    response_rate = float(interviewing_count / total_apps * 100) if total_apps > 0 else 0.0

    score = 50
    if total_apps > 0:
        score += int((active_count / total_apps) * 30)
    if interviewing_count > 0:
        score += 20
    score = min(max(score, 0), 100)

    tips = [
        "Keep applying! Aim for at least 3 active applications.",
        "Follow up on applications older than 7 days.",
        "Tailor your resume for lower-scoring applications to improve response rate."
    ]

    new_id = str(uuid.uuid4())
    try:
        pod.records.create("health_score_history", {
            "id": new_id,
            "overall_score": score,
            "calculated_at": datetime.utcnow().isoformat() + "Z",
            "active_applications_count": active_count,
            "interview_stage_count": interviewing_count,
            "coaching_tips": tips
        })
    except Exception:
        pass

    return CalculateHealthResult(
        overall_score=score,
        active_applications_count=active_count,
        response_rate=response_rate,
        ai_tips=tips
    )
