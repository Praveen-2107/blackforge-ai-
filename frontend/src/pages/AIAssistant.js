import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API = 'http://127.0.0.1:8000/api/ai';

/* ── Markdown-lite renderer (bold, bullets, headers) ── */
function renderMarkdown(text) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 18, fontWeight: 800, color: 'var(--cyan)', marginTop: 16, marginBottom: 6 }}>{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12, marginBottom: 4 }}>{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', marginTop: 8, marginBottom: 2 }}>{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) {
            return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 13, lineHeight: 1.6 }}>{formatInline(line.slice(2))}</span>
            </div>;
        }
        if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>{formatInline(line)}</p>;
    });
}

function formatInline(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
            ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
            : p
    );
}

/* ── Suggested prompts ── */
const SUGGESTIONS = [
    'What is label flipping and how dangerous is it?',
    'Explain my current threat score',
    'What should I do after purification?',
    'How does spectral analysis detect poisoning?',
    'What is the difference between backdoor and outlier attacks?',
    'How can I prevent dataset poisoning in future?',
];

function AIAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState(null);   // null=checking, true/false
    const [availableModels, setAvailableModels] = useState([]);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'report'
    const [reportData, setReportData] = useState({ analysis_data: {}, purification_data: null, dataset_name: '' });
    const [report, setReport] = useState('');
    const [generating, setGenerating] = useState(false);
    const [reportError, setReportError] = useState(null);
    const bottomRef = useRef(null);
    const abortRef = useRef(null);

    /* Check Ollama on mount */
    useEffect(() => {
        checkOllama();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkOllama = async () => {
        try {
            const res = await axios.get(`${API}/status`);
            setOllamaStatus(res.data.ollama_running);
            setAvailableModels(res.data.models || []);
        } catch {
            setOllamaStatus(false);
        }
    };

    /* ── Send chat message ── */
    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || streaming) return;
        setInput('');

        const userMsg = { role: 'user', content: userText };
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }]);
        setStreaming(true);

        try {
            const response = await fetch(`${API}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText, history }),
                signal: (abortRef.current = new AbortController()).signal,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
                    return updated;
                });
            }

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: false };
                return updated;
            });

        } catch (err) {
            if (err.name === 'AbortError') return;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: `⚠ Error: ${err.message}`,
                    streaming: false,
                    error: true,
                };
                return updated;
            });
        } finally {
            setStreaming(false);
        }
    };

    /* ── Generate report ── */
    const generateReport = async () => {
        if (!reportData.dataset_name && !reportData.analysis_data?.threat_score) {
            setReportError('Please fill in at least the dataset name and threat score.');
            return;
        }
        setGenerating(true);
        setReport('');
        setReportError(null);
        try {
            const res = await axios.post(`${API}/report`, reportData, { timeout: 180000 });
            setReport(res.data.report);
        } catch (err) {
            setReportError(err.response?.data?.detail || err.message || 'Report generation failed.');
        } finally {
            setGenerating(false);
        }
    };

    const clearChat = () => {
        abortRef.current?.abort();
        setMessages([]);
        setStreaming(false);
    };

    const copyReport = () => {
        navigator.clipboard.writeText(report);
    };

    /* ── Ollama not running banner ── */
    const OllamaOfflineBanner = () => (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>⚠</span>
            <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Ollama is not running</div>
                <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    To use the AI assistant, follow these steps:<br />
                    <strong>1.</strong> Download Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>ollama.com</a><br />
                    <strong>2.</strong> Install and open it<br />
                    <strong>3.</strong> Open a terminal and run: <code style={{ background: 'rgba(0,217,255,0.1)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono' }}>ollama pull llama3</code><br />
                    <strong>4.</strong> Wait for the download, then refresh this page
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={checkOllama}>
                    ↻ Check Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="page-content">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                {/* Header */}
                <div className="page-header">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="page-title">AI Assistant</h1>
                        <span className={`badge ${ollamaStatus ? 'badge-green' : ollamaStatus === false ? 'badge-red' : 'badge-cyan'}`}>
                            {ollamaStatus ? `● ONLINE · ${availableModels[0]?.split(':')[0] || 'llama3'}` : ollamaStatus === false ? '● OFFLINE' : '● CHECKING...'}
                        </span>
                    </div>
                    <p className="page-subtitle">
                        Powered by Ollama — runs 100% locally on your machine. No data leaves your system.
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
                    {[
                        { id: 'chat', label: '💬 Chat Assistant' },
                        { id: 'report', label: '📄 Auto Report' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                background: activeTab === t.id ? 'linear-gradient(135deg, var(--cyan), var(--purple))' : 'transparent',
                                color: activeTab === t.id ? '#000' : 'var(--text-muted)',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── CHAT TAB ── */}
                    {activeTab === 'chat' && (
                        <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                            {ollamaStatus === false && <OllamaOfflineBanner />}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, height: 'calc(100vh - 320px)', minHeight: 480 }}>

                                {/* Chat window */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                    {/* Messages */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {messages.length === 0 ? (
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.6 }}>
                                                <div style={{ fontSize: 40 }}>🤖</div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>BlackForge AI Assistant</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
                                                    Ask me anything about your dataset analysis, threat scores, or ML security best practices.
                                                </div>
                                            </div>
                                        ) : (
                                            messages.map((msg, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                                        gap: 10, alignItems: 'flex-start',
                                                    }}
                                                >
                                                    {/* Avatar */}
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 14,
                                                        background: msg.role === 'user'
                                                            ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
                                                            : 'var(--bg-elevated)',
                                                        border: '1px solid var(--border)',
                                                    }}>
                                                        {msg.role === 'user' ? '👤' : '🤖'}
                                                    </div>

                                                    {/* Bubble */}
                                                    <div style={{
                                                        maxWidth: '78%',
                                                        padding: '10px 14px',
                                                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                                        background: msg.role === 'user'
                                                            ? 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(192,0,255,0.1))'
                                                            : 'var(--bg-elevated)',
                                                        border: `1px solid ${msg.error ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                                                    }}>
                                                        {msg.role === 'assistant'
                                                            ? <div>{renderMarkdown(msg.content)}{msg.streaming && <span className="cursor-blink" style={{ color: 'var(--cyan)' }}>▌</span>}</div>
                                                            : <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
                                                        }
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                        <div ref={bottomRef} />
                                    </div>

                                    {/* Input */}
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                                        <input
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Ask about your analysis, threats, or ML security..."
                                            disabled={streaming || ollamaStatus === false}
                                            style={{
                                                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                borderRadius: 10, padding: '10px 14px', fontSize: 13,
                                                color: 'var(--text-primary)', outline: 'none',
                                                fontFamily: 'inherit',
                                            }}
                                        />
                                        <motion.button
                                            className="btn btn-primary"
                                            onClick={() => sendMessage()}
                                            disabled={!input.trim() || streaming || ollamaStatus === false}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.96 }}
                                            style={{ padding: '10px 18px', flexShrink: 0 }}
                                        >
                                            {streaming ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '↑ Send'}
                                        </motion.button>
                                        {messages.length > 0 && (
                                            <button className="btn btn-ghost" onClick={clearChat} style={{ padding: '10px 12px', flexShrink: 0 }} title="Clear chat">
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Suggestions panel */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className="card card-p">
                                        <div className="section-title mb-3" style={{ fontSize: 11 }}>QUICK QUESTIONS</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {SUGGESTIONS.map((s, i) => (
                                                <motion.button
                                                    key={i}
                                                    onClick={() => sendMessage(s)}
                                                    disabled={streaming || ollamaStatus === false}
                                                    whileHover={{ x: 3 }}
                                                    style={{
                                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                        borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                                                        textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)',
                                                        lineHeight: 1.4, transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {s}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card card-p">
                                        <div className="section-title mb-3" style={{ fontSize: 11 }}>MODEL INFO</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                            <div>Engine: <span className="mono text-cyan">Ollama</span></div>
                                            <div>Model: <span className="mono text-cyan">{availableModels[0]?.split(':')[0] || 'llama3'}</span></div>
                                            <div>Privacy: <span style={{ color: '#4ade80' }}>100% Local</span></div>
                                            <div>Internet: <span style={{ color: '#4ade80' }}>Not Required</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── REPORT TAB ── */}
                    {activeTab === 'report' && (
                        <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                            {ollamaStatus === false && <OllamaOfflineBanner />}

                            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>

                                {/* Input form */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className="card card-p">
                                        <div className="section-title mb-4">Analysis Data</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                            {[
                                                { label: 'Dataset Name', key: 'dataset_name', type: 'text', placeholder: 'e.g. training_data.csv', top: true },
                                            ].map(f => (
                                                <div key={f.key}>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                                                    <input
                                                        type={f.type}
                                                        placeholder={f.placeholder}
                                                        value={f.top ? reportData[f.key] : reportData.analysis_data[f.key] || ''}
                                                        onChange={e => f.top
                                                            ? setReportData(p => ({ ...p, [f.key]: e.target.value }))
                                                            : setReportData(p => ({ ...p, analysis_data: { ...p.analysis_data, [f.key]: parseFloat(e.target.value) || e.target.value } }))
                                                        }
                                                        style={{
                                                            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                            borderRadius: 8, padding: '8px 12px', fontSize: 12,
                                                            color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            {[
                                                { label: 'Poison Confidence (%)', key: 'poison_confidence', placeholder: '72.4' },
                                                { label: 'Threat Score (/100)', key: 'threat_score', placeholder: '65.0' },
                                                { label: 'Suspicious Samples', key: 'suspicious_sample_count', placeholder: '23' },
                                                { label: 'Accuracy Impact (%)', key: 'estimated_accuracy_impact', placeholder: '12.5' },
                                            ].map(f => (
                                                <div key={f.key}>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                                                    <input
                                                        type="number"
                                                        placeholder={f.placeholder}
                                                        value={reportData.analysis_data[f.key] || ''}
                                                        onChange={e => setReportData(p => ({ ...p, analysis_data: { ...p.analysis_data, [f.key]: parseFloat(e.target.value) } }))}
                                                        style={{
                                                            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                            borderRadius: 8, padding: '8px 12px', fontSize: 12,
                                                            color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            <div>
                                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Poison Type</label>
                                                <select
                                                    value={reportData.analysis_data.poison_type || ''}
                                                    onChange={e => setReportData(p => ({ ...p, analysis_data: { ...p.analysis_data, poison_type: e.target.value } }))}
                                                    style={{
                                                        width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                        borderRadius: 8, padding: '8px 12px', fontSize: 12,
                                                        color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <option value="">Select type...</option>
                                                    <option value="label_flipping">Label Flipping</option>
                                                    <option value="outlier_injection">Outlier Injection</option>
                                                    <option value="backdoor">Backdoor Attack</option>
                                                    <option value="feature_noise">Feature Noise</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Threat Grade</label>
                                                <select
                                                    value={reportData.analysis_data.threat_grade || ''}
                                                    onChange={e => setReportData(p => ({ ...p, analysis_data: { ...p.analysis_data, threat_grade: e.target.value } }))}
                                                    style={{
                                                        width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                        borderRadius: 8, padding: '8px 12px', fontSize: 12,
                                                        color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <option value="">Select grade...</option>
                                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {reportError && (
                                        <div className="alert alert-error">
                                            <span>⚠</span>
                                            <div style={{ fontSize: 12 }}>{reportError}</div>
                                        </div>
                                    )}

                                    <motion.button
                                        className="btn btn-primary btn-lg"
                                        onClick={generateReport}
                                        disabled={generating || ollamaStatus === false}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {generating
                                            ? <><div className="spinner" />Generating Report...</>
                                            : <><span>📄</span> Generate AI Report</>
                                        }
                                    </motion.button>
                                </div>

                                {/* Report output */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span className="section-title" style={{ margin: 0 }}>Generated Report</span>
                                        {report && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={copyReport}>📋 Copy</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                                    const blob = new Blob([report], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `blackforge_report_${Date.now()}.md`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}>⬇ Download</button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', padding: 24, minHeight: 400 }}>
                                        {generating ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                                                <div className="spinner" style={{ width: 40, height: 40 }} />
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI is writing your threat report...</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">This may take 30–60 seconds</div>
                                            </div>
                                        ) : report ? (
                                            <div>{renderMarkdown(report)}</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.5 }}>
                                                <div style={{ fontSize: 40 }}>📄</div>
                                                <div style={{ fontSize: 14, fontWeight: 600 }}>No report yet</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                                                    Fill in the analysis data on the left and click Generate
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </motion.div>

            <style>{`
        .cursor-blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .badge-green { background: rgba(74,222,128,0.15); color: #4ade80; border-color: rgba(74,222,128,0.3); }
      `}</style>
        </div>
    );
}

export default AIAssistant;
