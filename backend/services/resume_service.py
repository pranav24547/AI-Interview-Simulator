"""Resume parsing service for PDF and DOCX files."""

import io
from PyPDF2 import PdfReader
from docx import Document


def parse_resume(file_bytes: bytes, filename: str) -> str:
    """Extract text from a resume file (PDF or DOCX).

    Args:
        file_bytes: Raw file content.
        filename: Original filename to determine format.

    Returns:
        Extracted text content.

    Raises:
        ValueError: If file format is unsupported.
    """
    lower = filename.lower()

    if lower.endswith(".pdf"):
        return _parse_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return _parse_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: {filename}. Please upload a PDF or DOCX file.")


def _parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts).strip()


def _parse_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes."""
    doc = Document(io.BytesIO(file_bytes))
    text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
    return "\n".join(text_parts).strip()
