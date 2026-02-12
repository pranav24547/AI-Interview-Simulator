"""Interview API router — session management, answering, evaluation."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from models import (
    InterviewStartRequest, InterviewStartResponse,
    AnswerFeedback, QuestionAnswer, SessionSummary, SessionListItem
)
from services import llm_service, stt_service, sentiment_service

router = APIRouter(prefix="/api/interview", tags=["Interview"])

# In-memory session store
sessions: dict[str, dict] = {}


@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(req: InterviewStartRequest):
    """Start a new interview session — generates questions and returns the first one."""
    session_id = str(uuid.uuid4())[:8]

    questions = await llm_service.generate_questions(
        role=req.role,
        num_questions=req.num_questions,
        resume_text=req.resume_text,
    )

    sessions[session_id] = {
        "session_id": session_id,
        "role": req.role,
        "questions": questions,
        "current_index": 0,
        "qa_pairs": [],
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "resume_text": req.resume_text,
    }

    return InterviewStartResponse(
        session_id=session_id,
        role=req.role,
        num_questions=len(questions),
        first_question=questions[0],
        question_number=1,
    )


@router.post("/answer/text", response_model=AnswerFeedback)
async def submit_text_answer(session_id: str = Form(...), answer_text: str = Form(...)):
    """Submit a text-based answer for the current question."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    idx = session["current_index"]
    questions = session["questions"]

    if idx >= len(questions):
        raise HTTPException(status_code=400, detail="All questions already answered")

    question = questions[idx]
    return await _process_answer(session, question, answer_text)


@router.post("/answer/audio", response_model=AnswerFeedback)
async def submit_audio_answer(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
):
    """Submit a voice-based answer — transcribes then evaluates."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    idx = session["current_index"]
    questions = session["questions"]

    if idx >= len(questions):
        raise HTTPException(status_code=400, detail="All questions already answered")

    # Transcribe audio
    audio_bytes = await audio.read()
    answer_text = await stt_service.transcribe(audio_bytes, audio.filename or "audio.webm")

    if not answer_text.strip():
        raise HTTPException(status_code=400, detail="Could not transcribe audio. Please try again.")

    question = questions[idx]
    return await _process_answer(session, question, answer_text)


async def _process_answer(session: dict, question: str, answer_text: str) -> AnswerFeedback:
    """Evaluate an answer, score sentiment, store result, advance to next question."""
    role = session["role"]

    # Evaluate with LLM
    evaluation = await llm_service.evaluate_answer(question, answer_text, role)

    # Sentiment analysis
    sentiment_result = sentiment_service.analyze(answer_text)

    # Store Q&A pair
    qa = {
        "question": question,
        "answer": answer_text,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "strengths": evaluation.get("strengths", []),
        "improvements": evaluation.get("improvements", []),
        "sentiment": sentiment_result["sentiment"],
        "sentiment_score": sentiment_result["sentiment_score"],
        "confidence_score": sentiment_result["confidence_score"],
    }
    session["qa_pairs"].append(qa)

    # Advance to next question
    session["current_index"] += 1
    idx = session["current_index"]
    questions = session["questions"]
    is_complete = idx >= len(questions)
    next_q = questions[idx] if not is_complete else None

    return AnswerFeedback(
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        strengths=evaluation.get("strengths", []),
        improvements=evaluation.get("improvements", []),
        sentiment=sentiment_result["sentiment"],
        sentiment_score=sentiment_result["sentiment_score"],
        confidence_score=sentiment_result["confidence_score"],
        next_question=next_q,
        question_number=idx + (0 if is_complete else 1),
        total_questions=len(questions),
        is_complete=is_complete,
    )


@router.post("/end", response_model=SessionSummary)
async def end_interview(session_id: str = Form(...)):
    """End an interview session and get overall summary."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["ended_at"] = datetime.now(timezone.utc).isoformat()
    qa_pairs = session["qa_pairs"]

    if not qa_pairs:
        raise HTTPException(status_code=400, detail="No questions answered yet")

    avg_score = sum(qa["score"] for qa in qa_pairs) / len(qa_pairs)
    avg_sentiment = sum(qa["sentiment_score"] for qa in qa_pairs) / len(qa_pairs)
    avg_confidence = sum(qa["confidence_score"] for qa in qa_pairs) / len(qa_pairs)

    overall_feedback = await llm_service.generate_overall_feedback(session["role"], qa_pairs)

    return SessionSummary(
        session_id=session["session_id"],
        role=session["role"],
        started_at=session["started_at"],
        ended_at=session["ended_at"],
        num_questions=len(session["questions"]),
        questions_answered=len(qa_pairs),
        average_score=round(avg_score, 1),
        average_sentiment=round(avg_sentiment, 3),
        average_confidence=round(avg_confidence, 3),
        overall_feedback=overall_feedback,
        qa_pairs=[QuestionAnswer(**qa) for qa in qa_pairs],
    )


@router.get("/{session_id}", response_model=SessionSummary)
async def get_session(session_id: str):
    """Get details of a specific session."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    qa_pairs = session["qa_pairs"]
    avg_score = sum(qa["score"] for qa in qa_pairs) / len(qa_pairs) if qa_pairs else 0
    avg_sentiment = sum(qa["sentiment_score"] for qa in qa_pairs) / len(qa_pairs) if qa_pairs else 0
    avg_confidence = sum(qa["confidence_score"] for qa in qa_pairs) / len(qa_pairs) if qa_pairs else 0

    return SessionSummary(
        session_id=session["session_id"],
        role=session["role"],
        started_at=session["started_at"],
        ended_at=session.get("ended_at"),
        num_questions=len(session["questions"]),
        questions_answered=len(qa_pairs),
        average_score=round(avg_score, 1),
        average_sentiment=round(avg_sentiment, 3),
        average_confidence=round(avg_confidence, 3),
        overall_feedback="Interview in progress." if not session.get("ended_at") else "",
        qa_pairs=[QuestionAnswer(**qa) for qa in qa_pairs],
    )


@router.get("/", response_model=list[SessionListItem])
async def get_history():
    """List all interview sessions."""
    items = []
    for s in sessions.values():
        qa = s["qa_pairs"]
        avg = sum(q["score"] for q in qa) / len(qa) if qa else 0
        items.append(SessionListItem(
            session_id=s["session_id"],
            role=s["role"],
            started_at=s["started_at"],
            ended_at=s.get("ended_at"),
            questions_answered=len(qa),
            num_questions=len(s["questions"]),
            average_score=round(avg, 1),
        ))
    return sorted(items, key=lambda x: x.started_at, reverse=True)
