import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiClock, FiTrendingUp, FiAward, FiMic } from 'react-icons/fi';
import { getHistory } from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import './Dashboard.css';

export default function Dashboard() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHistory()
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, []);

    const stats = {
        total: history.length,
        avgScore: history.length
            ? (history.reduce((a, h) => a + h.average_score, 0) / history.length).toFixed(1)
            : '0.0',
        bestScore: history.length
            ? Math.max(...history.map((h) => h.average_score)).toFixed(1)
            : '0.0',
    };

    return (
        <div className="page">
            <div className="container">
                {/* Hero Section */}
                <motion.section
                    className="hero"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Master Your Next
                            <br />
                            <span className="text-gradient">Interview</span>
                        </h1>
                        <p className="hero-subtitle">
                            AI-powered mock interviews with real-time feedback,
                            voice recognition, and intelligent scoring.
                        </p>
                        <Link to="/setup" className="btn btn-primary hero-cta">
                            Start New Interview <FiArrowRight />
                        </Link>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-card glass-card">
                            <FiMic className="hero-card-icon" />
                            <span>Voice-Powered AI</span>
                        </div>
                        <div className="hero-card glass-card">
                            <FiTrendingUp className="hero-card-icon" />
                            <span>Smart Scoring</span>
                        </div>
                        <div className="hero-card glass-card">
                            <FiAward className="hero-card-icon" />
                            <span>Expert Feedback</span>
                        </div>
                    </div>
                </motion.section>

                {/* Stats */}
                <motion.section
                    className="stats-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="glass-card stat-card">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Interviews</span>
                    </div>
                    <div className="glass-card stat-card">
                        <span className="stat-value text-gradient">{stats.avgScore}</span>
                        <span className="stat-label">Average Score</span>
                    </div>
                    <div className="glass-card stat-card">
                        <span className="stat-value" style={{ color: 'var(--success)' }}>
                            {stats.bestScore}
                        </span>
                        <span className="stat-label">Best Score</span>
                    </div>
                </motion.section>

                {/* History */}
                <motion.section
                    className="history-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <h2 className="section-title">Recent Interviews</h2>

                    {loading && (
                        <div className="history-grid">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
                            ))}
                        </div>
                    )}

                    {!loading && history.length === 0 && (
                        <div className="empty-state glass-card">
                            <FiMic style={{ fontSize: '2rem', color: 'var(--accent-primary)' }} />
                            <p>No interviews yet. Start your first one!</p>
                            <Link to="/setup" className="btn btn-primary">
                                Begin Interview <FiArrowRight />
                            </Link>
                        </div>
                    )}

                    {!loading && history.length > 0 && (
                        <div className="history-grid">
                            {history.map((session, i) => (
                                <motion.div
                                    key={session.session_id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link
                                        to={`/results/${session.session_id}`}
                                        className="glass-card history-card"
                                    >
                                        <div className="history-card-header">
                                            <span className="history-role">{session.role}</span>
                                            <span className="history-date">
                                                <FiClock />
                                                {new Date(session.started_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="history-card-body">
                                            <ScoreGauge score={session.average_score} size={70} label="" />
                                            <div className="history-meta">
                                                <span>{session.questions_answered}/{session.num_questions} questions</span>
                                                <span className="history-score">{session.average_score.toFixed(1)}/10</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    );
}
