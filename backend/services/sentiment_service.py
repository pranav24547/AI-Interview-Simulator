"""Sentiment and confidence analysis service."""

from textblob import TextBlob


def analyze(text: str) -> dict:
    """Analyze text for sentiment polarity and confidence (subjectivity).

    Returns:
        dict with keys:
        - sentiment: "Positive", "Negative", or "Neutral"
        - sentiment_score: float from -1.0 to 1.0
        - confidence_score: float from 0.0 to 1.0 (higher = more opinionated/confident)
    """
    blob = TextBlob(text)

    polarity = blob.sentiment.polarity       # -1.0 to 1.0
    subjectivity = blob.sentiment.subjectivity  # 0.0 to 1.0

    if polarity > 0.1:
        sentiment_label = "Positive"
    elif polarity < -0.1:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"

    return {
        "sentiment": sentiment_label,
        "sentiment_score": round(polarity, 3),
        "confidence_score": round(subjectivity, 3),
    }
