"""Resume upload and parsing router."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services import resume_service

router = APIRouter(prefix="/api/resume", tags=["Resume"])


class ResumeParseResponse(BaseModel):
    """Response after parsing a resume."""
    filename: str
    text_preview: str
    total_characters: int


@router.post("/upload", response_model=ResumeParseResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a resume file (PDF or DOCX)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed = (".pdf", ".docx")
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    file_bytes = await file.read()

    try:
        text = resume_service.parse_resume(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse resume: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from resume")

    return ResumeParseResponse(
        filename=file.filename,
        text_preview=text[:500] + ("..." if len(text) > 500 else ""),
        total_characters=len(text),
    )
