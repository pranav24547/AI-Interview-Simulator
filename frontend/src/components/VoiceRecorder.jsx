import { FiMic, FiSquare, FiRotateCcw } from 'react-icons/fi';
import useAudioRecorder from '../hooks/useAudioRecorder';
import './VoiceRecorder.css';

/**
 * Voice recording component with animated visualizer.
 * @param {{ onRecordingComplete: (blob: Blob) => void, disabled?: boolean }} props
 */
export default function VoiceRecorder({ onRecordingComplete, disabled = false }) {
    const { isRecording, audioBlob, formattedDuration, start, stop, reset } = useAudioRecorder();

    const handleStop = () => {
        stop();
        // Small delay to let the blob finalize
        setTimeout(() => {
            // audioBlob will be set by the onstop handler
        }, 200);
    };

    const handleSubmit = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            reset();
        }
    };

    return (
        <div className={`voice-recorder ${isRecording ? 'recording' : ''}`}>
            {isRecording && (
                <div className="recorder-visualizer">
                    <div className="pulse-ring" />
                    <div className="pulse-ring delay-1" />
                    <div className="pulse-ring delay-2" />
                </div>
            )}

            <div className="recorder-controls">
                {!isRecording && !audioBlob && (
                    <button
                        className="btn btn-primary recorder-btn"
                        onClick={start}
                        disabled={disabled}
                    >
                        <FiMic />
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <>
                        <span className="recorder-timer">{formattedDuration}</span>
                        <button className="btn btn-danger recorder-btn" onClick={handleStop}>
                            <FiSquare />
                            Stop
                        </button>
                    </>
                )}

                {!isRecording && audioBlob && (
                    <div className="recorder-preview">
                        <audio src={URL.createObjectURL(audioBlob)} controls className="recorder-audio" />
                        <div className="recorder-actions">
                            <button className="btn btn-secondary" onClick={reset}>
                                <FiRotateCcw />
                                Re-record
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                Submit Voice Answer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
