import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiClock, FiRepeat, FiCheckCircle } from 'react-icons/fi';
import { getSession, endInterview } from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import SentimentBadge from '../components/SentimentBadge';
import './Results.css';

export default function Results() {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                // Try ending the session first (safe to call even if already ended)
                try {
                    await endInterview(sessionId);
                } catch { }
                const data = await getSession(sessionId);
                setSession(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="page">
                <div className="container results-container">
                    <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
                    <div className="skeleton" style={{ height: 400, borderRadius: 16, marginTop: 20 }} />
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
                    <p>Session not found.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container results-container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="results-header"
                >
                    <Link to="/" className="btn btn-secondary">
                        <FiArrowLeft /> Dashboard
                    </Link>
                    <Link to="/setup" className="btn btn-primary">
                        <FiRepeat /> New Interview
                    </Link>
                </motion.div>

                {/* Summary Card */}
                <motion.div
                    className="glass-card summary-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="summary-top">
                        <div>
                            <h1 className="summary-title">Interview Results</h1>
                            <p className="summary-role">{session.role}</p>
                            <div className="summary-meta">
                                <span>
                                    <FiClock /> {new Date(session.started_at).toLocaleDateString()}
                                </span>
                                <span>
                                    <FiCheckCircle /> {session.questions_answered}/{session.num_questions} answered
                                </span>
                            </div>
                        </div>
                        <ScoreGauge score={session.average_score} size={140} label="Overall" />
                    </div>

                    {/* Score breakdown */}
                    <div className="summary-scores">
                        <div className="score-item">
                            <span className="score-item-label">Avg Score</span>
                            <span className="score-item-value">{session.average_score.toFixed(1)}/10</span>
                        </div>
                        <div className="score-item">
                            <span className="score-item-label">Sentiment</span>
                            <span className="score-item-value">
                                {session.average_sentiment > 0 ? '+' : ''}
                                {session.average_sentiment.toFixed(2)}
                            </span>
                        </div>
                        <div className="score-item">
                            <span className="score-item-label">Confidence</span>
                            <span className="score-item-value">
                                {(session.average_confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* Overall feedback */}
                    {session.overall_feedback && session.overall_feedback !== 'Interview in progress.' && (
                        <div className="overall-feedback">
                            <h3>AI Coach Feedback</h3>
                            <p>{session.overall_feedback}</p>
                        </div>
                    )}
                </motion.div>

                {/* Per-question breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="section-title" style={{ marginTop: 40 }}>
                        Question-by-Question Breakdown
                    </h2>

                    <div className="qa-list">
                        {session.qa_pairs.map((qa, i) => (
                            <motion.div
                                key={i}
                                className="glass-card qa-card"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                            >
                                <div className="qa-card-header">
                                    <span className="qa-num">Q{i + 1}</span>
                                    <ScoreGauge score={qa.score} size={60} label="" />
                                </div>

                                <h4 className="qa-question">{qa.question}</h4>

                                <div className="qa-answer">
                                    <span className="qa-answer-label">Your Answer:</span>
                                    <p>{qa.answer}</p>
                                </div>

                                <div className="qa-feedback-text">
                                    <p>{qa.feedback}</p>
                                </div>

                                <div className="qa-tags">
                                    <SentimentBadge sentiment={qa.sentiment} score={qa.sentiment_score} />
                                    <span className="badge" style={{
                                        background: 'rgba(108, 92, 231, 0.1)',
                                        color: 'var(--accent-secondary)',
                                    }}>
                                        Confidence: {(qa.confidence_score * 100).toFixed(0)}%
                                    </span>
                                </div>

                                {qa.strengths?.length > 0 && (
                                    <div className="qa-list-section">
                                        <span className="qa-list-label success-text">Strengths:</span>
                                        {qa.strengths.map((s, j) => (
                                            <span key={j} className="qa-tag success-tag">{s}</span>
                                        ))}
                                    </div>
                                )}

                                {qa.improvements?.length > 0 && (
                                    <div className="qa-list-section">
                                        <span className="qa-list-label warning-text">Improve:</span>
                                        {qa.improvements.map((s, j) => (
                                            <span key={j} className="qa-tag warning-tag">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
