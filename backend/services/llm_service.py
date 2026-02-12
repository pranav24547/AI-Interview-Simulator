"""LLM service for generating interview questions and evaluating answers."""

import json
from openai import AsyncOpenAI
from config import get_settings

_client = None

def _get_client():
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    return _client


async def generate_questions(role: str, num_questions: int = 5, resume_text: str | None = None) -> list[str]:
    """Generate role-specific interview questions using GPT-4o."""

    resume_context = ""
    if resume_text:
        resume_context = f"""
The candidate has provided their resume. Use it to personalize some questions:
--- RESUME ---
{resume_text[:3000]}
--- END RESUME ---
"""

    prompt = f"""You are an expert technical interviewer. Generate exactly {num_questions} interview questions for a {role} position.

{resume_context}

Requirements:
- Mix of technical, behavioral, and situational questions
- Progress from easier to harder
- If resume is provided, include 1-2 questions about their specific experience
- Questions should be open-ended and thought-provoking
- Each question should test a different skill area

Return ONLY a JSON array of strings, no other text. Example:
["Question 1?", "Question 2?"]"""

    response = await _get_client().chat.completions.create(
        model=get_settings().OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert interview coach. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    content = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    questions = json.loads(content)
    return questions[:num_questions]


async def evaluate_answer(question: str, answer: str, role: str) -> dict:
    """Evaluate a candidate's answer using GPT-4o."""

    prompt = f"""You are an expert interviewer evaluating a candidate for a {role} position.

Question: {question}
Candidate's Answer: {answer}

Evaluate the answer and provide:
1. score: A score from 0-10 (float, be fair but critical)
2. feedback: Detailed constructive feedback (2-3 sentences)
3. strengths: List of 1-3 things they did well
4. improvements: List of 1-3 areas for improvement

Return ONLY valid JSON in this exact format:
{{
  "score": 7.5,
  "feedback": "Your detailed feedback here.",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}}"""

    response = await _get_client().chat.completions.create(
        model=get_settings().OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert interview evaluator. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)


async def generate_overall_feedback(role: str, qa_pairs: list[dict]) -> str:
    """Generate overall interview feedback summary."""

    qa_summary = "\n".join([
        f"Q: {qa['question']}\nA: {qa['answer']}\nScore: {qa['score']}/10"
        for qa in qa_pairs
    ])

    prompt = f"""You are an expert interview coach. A candidate just completed a mock interview for a {role} position. Here's a summary:

{qa_summary}

Provide a 3-4 sentence overall assessment. Be encouraging but honest. Mention their strongest area and the most critical area to improve."""

    response = await _get_client().chat.completions.create(
        model=get_settings().OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a supportive interview coach."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.6,
        max_tokens=500,
    )

    return response.choices[0].message.content.strip()
