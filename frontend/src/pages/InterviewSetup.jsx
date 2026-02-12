import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiPlay, FiFileText } from 'react-icons/fi';
import { startInterview, uploadResume } from '../services/api';
import './InterviewSetup.css';

const ROLES = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Data Scientist',
    'DevOps Engineer',
    'Product Manager',
    'Mobile Developer',
    'ML Engineer',
    'System Design',
    'Behavioral',
];

export default function InterviewSetup() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [role, setRole] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeText, setResumeText] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResumeFile(file);
        setUploading(true);
        setError('');

        try {
            const result = await uploadResume(file);
            setResumeText(result.text_preview);
        } catch (err) {
            setError('Failed to parse resume. Please try a different file.');
            setResumeFile(null);
        } finally {
            setUploading(false);
        }
    };

    const removeResume = () => {
        setResumeFile(null);
        setResumeText(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStart = async () => {
        if (!role) {
            setError('Please select a role.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const session = await startInterview(role, numQuestions, resumeText);
            navigate(`/interview/${session.session_id}`, { state: { session } });
        } catch (err) {
            setError('Failed to start interview. Please check your API key and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container setup-container">
                <motion.div
                    className="setup-card glass-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="setup-title">
                        Configure Your <span className="text-gradient">Interview</span>
                    </h1>
                    <p className="setup-subtitle">
                        Select a role, upload your resume, and let the AI craft personalized questions.
                    </p>

                    {error && <div className="setup-error">{error}</div>}

                    {/* Role Selector */}
                    <div className="form-group">
                        <label className="label">Interview Role</label>
                        <div className="role-grid">
                            {ROLES.map((r) => (
                                <button
                                    key={r}
                                    className={`role-chip ${role === r ? 'active' : ''}`}
                                    onClick={() => setRole(r)}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Count */}
                    <div className="form-group">
                        <label className="label">
                            Number of Questions: <strong>{numQuestions}</strong>
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            className="range-slider"
                        />
                        <div className="range-labels">
                            <span>1</span>
                            <span>5</span>
                            <span>10</span>
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="form-group">
                        <label className="label">Resume (Optional)</label>
                        {!resumeFile ? (
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FiUpload className="upload-icon" />
                                <p>Click to upload or drag and drop</p>
                                <span className="upload-hint">PDF or DOCX (max 5MB)</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    hidden
                                />
                            </div>
                        ) : (
                            <div className="upload-preview glass-card">
                                <div className="upload-file-info">
                                    <FiFileText />
                                    <span>{resumeFile.name}</span>
                                    {uploading && <span className="badge badge-warning">Parsing...</span>}
                                    {!uploading && resumeText && (
                                        <span className="badge badge-success">Parsed</span>
                                    )}
                                </div>
                                <button className="upload-remove" onClick={removeResume}>
                                    <FiX />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Start Button */}
                    <motion.button
                        className="btn btn-primary start-btn"
                        onClick={handleStart}
                        disabled={loading || !role}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                Generating Questions...
                            </>
                        ) : (
                            <>
                                <FiPlay />
                                Start Interview
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
