"""Pydantic schemas for request/response models."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class InterviewRole(str, Enum):
    """Supported interview roles."""
    FRONTEND = "Frontend Developer"
    BACKEND = "Backend Developer"
    FULLSTACK = "Full-Stack Developer"
    DATA_SCIENCE = "Data Scientist"
    DEVOPS = "DevOps Engineer"
    PRODUCT_MANAGER = "Product Manager"
    MOBILE = "Mobile Developer"
    ML_ENGINEER = "ML Engineer"
    SYSTEM_DESIGN = "System Design"
    BEHAVIORAL = "Behavioral"


class InterviewStartRequest(BaseModel):
    """Request to start a new interview session."""
    role: str = Field(..., description="Interview role/position")
    num_questions: int = Field(default=5, ge=1, le=10, description="Number of questions")
    resume_text: Optional[str] = Field(default=None, description="Extracted resume text")


class InterviewStartResponse(BaseModel):
    """Response after starting an interview."""
    session_id: str
    role: str
    num_questions: int
    first_question: str
    question_number: int


class AnswerSubmission(BaseModel):
    """Text-based answer submission."""
    session_id: str
    answer_text: str


class AnswerFeedback(BaseModel):
    """AI-generated feedback for an answer."""
    score: float = Field(..., ge=0, le=10)
    feedback: str
    strengths: list[str]
    improvements: list[str]
    sentiment: str
    sentiment_score: float
    confidence_score: float
    next_question: Optional[str] = None
    question_number: int
    total_questions: int
    is_complete: bool


class QuestionAnswer(BaseModel):
    """A single Q&A record within a session."""
    question: str
    answer: str
    score: float
    feedback: str
    strengths: list[str]
    improvements: list[str]
    sentiment: str
    sentiment_score: float
    confidence_score: float


class SessionSummary(BaseModel):
    """Summary of a completed interview session."""
    session_id: str
    role: str
    started_at: str
    ended_at: Optional[str] = None
    num_questions: int
    questions_answered: int
    average_score: float
    average_sentiment: float
    average_confidence: float
    overall_feedback: str
    qa_pairs: list[QuestionAnswer]


class SessionListItem(BaseModel):
    """Brief session info for history list."""
    session_id: str
    role: str
    started_at: str
    ended_at: Optional[str] = None
    questions_answered: int
    num_questions: int
    average_score: float
