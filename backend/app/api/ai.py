from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL   = "llama3"          # change to "mistral" or any model you have pulled

# ── System prompt — gives Gemini the context of the app ──────────────────────
SYSTEM_PROMPT = """You are BlackForge AI Assistant, an expert cybersecurity analyst 
specializing in adversarial machine learning attacks and defenses.

You help users understand:
- Dataset poisoning attacks (label flipping, backdoor, outlier injection, feature noise)
- Detection methods (spectral signatures, activation clustering, influence functions)
- Threat scores and what they mean
- How to interpret purification results
- Best practices for securing ML pipelines

Keep responses concise, technical but clear. Use bullet points when listing items.
When given analysis data, provide specific actionable insights.
Always relate your answers back to the user's ML security context."""


# ── Request / Response schemas ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str        # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[Dict[str, Any]] = None   # analysis data to inject


class ReportRequest(BaseModel):
    analysis_data: Dict[str, Any]
    purification_data: Optional[Dict[str, Any]] = None
    dataset_name: Optional[str] = "Unknown Dataset"


# ── Helper: check Ollama is running ──────────────────────────────────────────

async def check_ollama() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


async def get_available_model() -> str:
    """Return the first available model, fallback to DEFAULT_MODEL."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if r.status_code == 200:
                models = r.json().get("models", [])
                if models:
                    return models[0]["name"].split(":")[0]
    except Exception:
        pass
    return DEFAULT_MODEL


# ── Build message list for Ollama ─────────────────────────────────────────────

def build_messages(
    message: str,
    history: List[ChatMessage],
    context: Optional[Dict[str, Any]],
) -> List[Dict[str, str]]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject analysis context if provided
    if context:
        ctx_text = (
            f"\n\n[CURRENT ANALYSIS CONTEXT]\n"
            f"Dataset: {context.get('dataset_name', 'Unknown')}\n"
            f"Poison Confidence: {context.get('poison_confidence', 0):.1f}%\n"
            f"Poison Type: {context.get('poison_type', 'Unknown')}\n"
            f"Threat Score: {context.get('threat_score', 0):.1f}/100\n"
            f"Threat Grade: {context.get('threat_grade', 'N/A')}\n"
            f"Suspicious Samples: {context.get('suspicious_sample_count', 0)}\n"
            f"Accuracy Impact: -{context.get('estimated_accuracy_impact', 0):.1f}%\n"
        )
        messages[0]["content"] += ctx_text

    # Add conversation history
    for msg in history[-10:]:   # keep last 10 turns to stay within context
        messages.append({"role": msg.role, "content": msg.content})

    # Add current user message
    messages.append({"role": "user", "content": message})
    return messages


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status")
async def ollama_status():
    """Check if Ollama is running and list available models."""
    running = await check_ollama()
    models  = []
    if running:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                models = [m["name"] for m in r.json().get("models", [])]
        except Exception:
            pass
    return {
        "ollama_running": running,
        "models":         models,
        "default_model":  DEFAULT_MODEL,
    }


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Send a message to Ollama and stream the response back.
    Supports conversation history and optional analysis context injection.
    """
    if not await check_ollama():
        raise HTTPException(
            status_code=503,
            detail=(
                "Ollama is not running. "
                "Please install Ollama from https://ollama.com and run: ollama pull llama3"
            ),
        )

    model    = await get_available_model()
    messages = build_messages(req.message, req.history, req.context)

    async def stream_response():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={"model": model, "messages": messages, "stream": True},
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                token = data.get("message", {}).get("content", "")
                                if token:
                                    yield token
                                if data.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            yield f"\n\n[Error: {str(e)}]"

    return StreamingResponse(stream_response(), media_type="text/plain")


@router.post("/report")
async def generate_report(req: ReportRequest):
    """
    Generate a full professional threat report from analysis + purification data.
    Returns the complete report as a JSON object with sections.
    """
    if not await check_ollama():
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Please start Ollama first.",
        )

    model = await get_available_model()
    a     = req.analysis_data
    p     = req.purification_data

    prompt = f"""Generate a professional cybersecurity threat report for the following ML dataset analysis.
Format the report with these exact sections, using markdown:

# BLACKFORGE AI — THREAT ASSESSMENT REPORT

## Executive Summary
(2-3 sentences summarizing the threat level and key findings)

## Dataset Information
- Dataset: {req.dataset_name}
- Analysis Date: (today's date)

## Threat Assessment
- Poison Confidence: {a.get('poison_confidence', 0):.1f}%
- Threat Score: {a.get('threat_score', 0):.1f}/100
- Threat Grade: {a.get('threat_grade', 'N/A')}
- Attack Type: {a.get('poison_type', 'Unknown')}
- Suspicious Samples: {a.get('suspicious_sample_count', 0)}
- Estimated Accuracy Impact: -{a.get('estimated_accuracy_impact', 0):.1f}%

## Attack Analysis
(Explain what {a.get('poison_type', 'this attack type')} is, how it works, and why it's dangerous)

## Detection Findings
(Explain what the spectral, activation clustering, and influence function methods found)

## Risk Assessment
(Rate the overall risk: Critical/High/Medium/Low and explain why)

{'## Purification Results' + chr(10) + f"- Samples Removed: {p.get('poisoned_samples_removed', 0)}" + chr(10) + f"- Accuracy Before: {p.get('accuracy_before', 0):.1f}%" + chr(10) + f"- Accuracy After: {p.get('accuracy_after', 0):.1f}%" + chr(10) + f"- Data Integrity Score: {p.get('data_integrity_score', 0):.1f}%" if p else ''}

## Recommendations
(List 5 specific, actionable recommendations to prevent future attacks)

## Conclusion
(1-2 sentences closing statement)

Write the full report now:"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": prompt},
    ]

    full_report = ""
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/chat",
                json={"model": model, "messages": messages, "stream": True},
            ) as response:
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data  = json.loads(line)
                            token = data.get("message", {}).get("content", "")
                            full_report += token
                            if data.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "report":     full_report,
        "model_used": model,
        "dataset":    req.dataset_name,
    }
