import './ScoreGauge.css';

/**
 * Animated radial gauge displaying a score from 0-10.
 * @param {{ score: number, size?: number, label?: string }} props
 */
export default function ScoreGauge({ score, size = 120, label = 'Score' }) {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(score / 10, 1);
    const offset = circumference * (1 - pct);

    const getColor = (s) => {
        if (s >= 7) return 'var(--success)';
        if (s >= 4) return 'var(--warning)';
        return 'var(--danger)';
    };

    return (
        <div className="score-gauge" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="gauge-svg">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--bg-card)"
                    strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor(score)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="gauge-progress"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div className="gauge-text">
                <span className="gauge-value" style={{ color: getColor(score) }}>
                    {score.toFixed(1)}
                </span>
                <span className="gauge-label">{label}</span>
            </div>
        </div>
    );
}
