from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import anthropic
import httpx
import json

print("API KEY:", os.getenv("ANTHROPIC_KEY")[:20] if os.getenv("ANTHROPIC_KEY") else "NO ENCONTRADA")

app = FastAPI(title="Bereano API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://ebc.jetro.es"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    platform: str = "claude"

# ── CLAUDE ──────────────────────────────────────────────────────
async def stream_claude(prompt: str):
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_KEY"))
    try:
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=16000,
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'text': f'Error: {str(e)}'})}\n\n"
    finally:
        yield "data: [DONE]\n\n"

# ── CHATGPT / DEEPSEEK ───────────────────────────────────────────
async def stream_openai_compatible(prompt: str, platform: str):
    urls = {
        "chatgpt":  "https://api.openai.com/v1/chat/completions",
        "deepseek": "https://api.deepseek.com/v1/chat/completions"
    }
    keys = {
        "chatgpt":  os.getenv("OPENAI_KEY"),
        "deepseek": os.getenv("DEEPSEEK_KEY")
    }
    models = {
        "chatgpt":  "gpt-4o",
        "deepseek": "deepseek-chat"
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST", urls[platform],
            headers={"Authorization": f"Bearer {keys[platform]}", "Content-Type": "application/json"},
            json={"model": models[platform], "messages": [{"role": "user", "content": prompt}], "stream": True}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:].strip()
                    if data == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    try:
                        parsed = json.loads(data)
                        text = parsed["choices"][0]["delta"].get("content", "")
                        if text:
                            yield f"data: {json.dumps({'text': text})}\n\n"
                    except:
                        pass

# ── GEMINI ───────────────────────────────────────────────────────
async def call_gemini(prompt: str):
    api_key = os.getenv("GEMINI_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        data = res.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

# ── ENDPOINT PRINCIPAL ───────────────────────────────────────────
@app.post("/generate")
async def generate(req: PromptRequest):
    if req.platform == "claude":
        return StreamingResponse(
            stream_claude(req.prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
    elif req.platform in ("chatgpt", "deepseek"):
        return StreamingResponse(
            stream_openai_compatible(req.prompt, req.platform),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
    elif req.platform == "gemini":
        return StreamingResponse(
            call_gemini(req.prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Plataforma no soportada")

@app.get("/health")
async def health():
    return {"status": "ok", "app": "Bereano API"}