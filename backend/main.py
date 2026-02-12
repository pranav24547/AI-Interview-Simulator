"""AI Interview Simulator — FastAPI Backend Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import interview, resume

app = FastAPI(
    title="AI Interview Simulator",
    description="An AI-powered mock interview system with voice input, LLM evaluation, and sentiment scoring.",
    version="1.0.0",
)

# CORS — allow the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(interview.router)
app.include_router(resume.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "AI Interview Simulator API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "services": {
            "llm": "OpenAI GPT-4o",
            "stt": "OpenAI Whisper",
            "sentiment": "TextBlob",
        },
    }
