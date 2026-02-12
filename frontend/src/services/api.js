import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 60000,
});

/* ---------- Interview ---------- */
export async function startInterview(role, numQuestions, resumeText = null) {
    const { data } = await api.post('/interview/start', {
        role,
        num_questions: numQuestions,
        resume_text: resumeText,
    });
    return data;
}

export async function submitTextAnswer(sessionId, answerText) {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('answer_text', answerText);
    const { data } = await api.post('/interview/answer/text', form);
    return data;
}

export async function submitAudioAnswer(sessionId, audioBlob) {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('audio', audioBlob, 'recording.webm');
    const { data } = await api.post('/interview/answer/audio', form);
    return data;
}

export async function endInterview(sessionId) {
    const form = new FormData();
    form.append('session_id', sessionId);
    const { data } = await api.post('/interview/end', form);
    return data;
}

export async function getSession(sessionId) {
    const { data } = await api.get(`/interview/${sessionId}`);
    return data;
}

export async function getHistory() {
    const { data } = await api.get('/interview/');
    return data;
}

/* ---------- Resume ---------- */
export async function uploadResume(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/resume/upload', form);
    return data;
}

export default api;
