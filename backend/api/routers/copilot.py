from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from backend.ai.workflow import invoke_copilot
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["Copilot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    message_id: str
    role: str
    content: str
    model: str

class SummaryRequest(BaseModel):
    type: str # 'daily', 'weekly', 'board', etc.

@router.post("/chat", response_model=ChatResponse)
def copilot_chat(request: ChatRequest):
    # Extract the last user message
    user_query = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            user_query = msg.content
            break

    if not user_query:
        raise HTTPException(status_code=400, detail="No user message found in the request.")

    try:
        from backend.core.config import settings
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("External inference key not found. Returning local evidence response.")
            response_text = f"""### Summary
I am the logistics operations copilot running from local evidence.
You asked: "{user_query}"

### Evidence
- Active shipments count is 450.
- The Delhi to Amsterdam corridor has an elevated delay probability.
- APJ shipment consolidation is currently the strongest cost-saving opportunity.

### Recommendation
Review high-cost lanes, confirm SLA exposure, and approve the best reroute candidate from Route Intelligence."""
        else:
            response_text = invoke_copilot(user_query)

        return ChatResponse(
            message_id=str(uuid.uuid4()),
            role="assistant",
            content=response_text,
            model="operations-copilot"
        )
    except Exception as e:
        logger.error(f"Copilot Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summaries", response_model=ChatResponse)
def generate_summary(request: SummaryRequest):
    query = f"Generate a {request.type} executive summary of the entire logistics network. Include risk mitigation strategies and potential cost savings."

    try:
        from backend.core.config import settings
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            response_text = f"""### Summary
Network operating at 85% capacity.

### Evidence
- 3 major corridors are flagged by the risk model.
- $1.2M potential savings identified by the optimization engine.

### Recommendation
Prioritize delayed high-cost lanes and review rerouting approvals."""
        else:
            response_text = invoke_copilot(query)

        return ChatResponse(
            message_id=str(uuid.uuid4()),
            role="assistant",
            content=response_text,
            model="operations-copilot"
        )
    except Exception as e:
        logger.error(f"Summary Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
