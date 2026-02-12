import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMic, FiEdit3, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { submitTextAnswer, submitAudioAnswer, endInterview } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import ScoreGauge from '../components/ScoreGauge';
import SentimentBadge from '../components/SentimentBadge';
import './LiveInterview.css';

export default function LiveInterview() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [session, setSession] = useState(location.state?.session || null);
    const [currentQuestion, setCurrentQuestion] = useState(
        location.state?.session?.first_question || ''
    );
    const [questionNum, setQuestionNum] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(
        location.state?.session?.num_questions || 5
    );

    const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
    const [textAnswer, setTextAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [ending, setEnding] = useState(false);

    const progress = ((questionNum - 1 + (feedback ? 1 : 0)) / totalQuestions) * 100;

    const handleTextSubmit = async () => {
        if (!textAnswer.trim() || loading) return;
        setLoading(true);
        try {
            const result = await submitTextAnswer(sessionId, textAnswer);
            setFeedback(result);
            setIsComplete(result.is_complete);
            if (result.next_question) {
                setCurrentQuestion(result.next_question);
            }
            setQuestionNum(result.question_number);
            setTotalQuestions(result.total_questions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAudioSubmit = async (audioBlob) => {
        setLoading(true);
        try {
            const result = await submitAudioAnswer(sessionId, audioBlob);
            setFeedback(result);
            setIsComplete(result.is_complete);
            if (result.next_question) {
                setCurrentQuestion(result.next_question);
            }
            setQuestionNum(result.question_number);
            setTotalQuestions(result.total_questions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setFeedback(null);
        setTextAnswer('');
    };

    const handleEnd = async () => {
        setEnding(true);
        try {
            await endInterview(sessionId);
            navigate(`/results/${sessionId}`);
        } catch (err) {
            console.error(err);
            navigate(`/results/${sessionId}`);
        }
    };

    if (!session) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
                    <p>Session not found. Please start a new interview.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container interview-container">
                {/* Header */}
                <motion.div
                    className="interview-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h2 className="interview-role">{session.role}</h2>
                        <p className="interview-progress-text">
                            Question {Math.min(questionNum, totalQuestions)} of {totalQuestions}
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={handleEnd}
                        disabled={ending}
                    >
                        {ending ? 'Ending...' : 'End Interview'}
                    </button>
                </motion.div>

                {/* Progress Bar */}
                <div className="progress-bar" style={{ marginBottom: 32 }}>
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    {!feedback && (
                        <motion.div
                            key={`question-${questionNum}`}
                            className="question-section glass-card"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className="question-badge">Question {questionNum}</span>
                            <h3 className="question-text">{currentQuestion}</h3>

                            {/* Input mode toggle */}
                            <div className="input-toggle">
                                <button
                                    className={`toggle-btn ${inputMode === 'text' ? 'active' : ''}`}
                                    onClick={() => setInputMode('text')}
                                >
                                    <FiEdit3 /> Text
                                </button>
                                <button
                                    className={`toggle-btn ${inputMode === 'voice' ? 'active' : ''}`}
                                    onClick={() => setInputMode('voice')}
                                >
                                    <FiMic /> Voice
                                </button>
                            </div>

                            {/* Text Input */}
                            {inputMode === 'text' && (
                                <div className="text-input-area">
                                    <textarea
                                        className="textarea"
                                        placeholder="Type your answer here..."
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        rows={5}
                                        disabled={loading}
                                    />
                                    <button
                                        className="btn btn-primary submit-btn"
                                        onClick={handleTextSubmit}
                                        disabled={!textAnswer.trim() || loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner" /> Evaluating...
                                            </>
                                        ) : (
                                            <>
                                                <FiSend /> Submit Answer
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Voice Input */}
                            {inputMode === 'voice' && (
                                <VoiceRecorder
                                    onRecordingComplete={handleAudioSubmit}
                                    disabled={loading}
                                />
                            )}

                            {loading && inputMode === 'voice' && (
                                <div className="evaluating-state">
                                    <span className="spinner" />
                                    <span>Transcribing & evaluating your answer...</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <motion.div
                            key="feedback"
                            className="feedback-section glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="feedback-header">
                                <ScoreGauge score={feedback.score} size={100} />
                                <div className="feedback-meta">
                                    <SentimentBadge
                                        sentiment={feedback.sentiment}
                                        score={feedback.sentiment_score}
                                    />
                                    <span className="confidence-label">
                                        Confidence: {(feedback.confidence_score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <p className="feedback-text">{feedback.feedback}</p>

                            {feedback.strengths?.length > 0 && (
                                <div className="feedback-list">
                                    <h4 className="feedback-list-title success-text">✦ Strengths</h4>
                                    <ul>
                                        {feedback.strengths.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {feedback.improvements?.length > 0 && (
                                <div className="feedback-list">
                                    <h4 className="feedback-list-title warning-text">△ Areas to Improve</h4>
                                    <ul>
                                        {feedback.improvements.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="feedback-actions">
                                {!isComplete ? (
                                    <button className="btn btn-primary" onClick={handleNext}>
                                        Next Question <FiArrowRight />
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" onClick={handleEnd} disabled={ending}>
                                        <FiCheckCircle />
                                        {ending ? 'Loading Results...' : 'View Results'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
