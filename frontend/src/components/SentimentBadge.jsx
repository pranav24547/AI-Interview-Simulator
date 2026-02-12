import './SentimentBadge.css';
import { FiSmile, FiMeh, FiFrown } from 'react-icons/fi';

/**
 * Color-coded sentiment badge.
 * @param {{ sentiment: string, score?: number }} props
 */
export default function SentimentBadge({ sentiment, score }) {
    const config = {
        Positive: { icon: <FiSmile />, className: 'badge-success' },
        Neutral: { icon: <FiMeh />, className: 'badge-warning' },
        Negative: { icon: <FiFrown />, className: 'badge-danger' },
    };

    const { icon, className } = config[sentiment] || config.Neutral;

    return (
        <span className={`badge sentiment-badge ${className}`}>
            {icon}
            {sentiment}
            {score !== undefined && <span className="sentiment-score">({score.toFixed(2)})</span>}
        </span>
    );
}
