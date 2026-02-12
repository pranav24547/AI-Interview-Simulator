"""Speech-to-text service using OpenAI Whisper API."""

from openai import AsyncOpenAI
from config import get_settings
import io

_client = None

def _get_client():
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    return _client


async def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio bytes to text using OpenAI Whisper API.

    Args:
        audio_bytes: Raw audio data (supports webm, mp3, wav, etc.)
        filename: Original filename to help Whisper detect format.

    Returns:
        Transcribed text string.
    """
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcript = await _get_client().audio.transcriptions.create(
        model=get_settings().WHISPER_MODEL,
        file=audio_file,
        response_format="text",
    )

    return transcript.strip()
