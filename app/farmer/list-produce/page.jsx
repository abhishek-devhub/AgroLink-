'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MANDI_PRICES } from '@/lib/market-data';
import { CROPS } from '@/lib/config';

export default function ListProduce() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    crop: '', variety: '', quantity: '', unit: 'quintal',
    harvestDate: '', grade: 'A', description: '', price: '',
  });
  const [photos, setPhotos] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle');

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const mandiRate = MANDI_PRICES.find(m => m.crop.includes(form.crop));

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    const readAsDataUrl = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    const photoData = await Promise.all(files.map(readAsDataUrl));
    setPhotos(photoData.filter(Boolean).slice(0, 3));
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
  }, []);

  const startListening = useCallback((field) => {
    setVoiceError('');
    setInterimText('');
    setFinalText('');
    finalTranscriptRef.current = '';

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
    }

    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('listening');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalChunk) {
        finalTranscriptRef.current += ' ' + finalChunk;
        setFinalText(finalTranscriptRef.current.trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please speak clearly into your microphone and try again.');
      } else if (event.error === 'audio-capture') {
        setVoiceError('Microphone not found. Please ensure a microphone is connected and allowed.');
      } else if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else if (event.error === 'network') {
        setVoiceError('Network error during speech recognition. Please check your internet connection.');
      } else {
        setVoiceError('Error: ' + event.error + '. Please try again.');
      }
      setIsListening(false);
      setVoiceStatus('error');
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      const fullTranscript = finalTranscriptRef.current.trim();

      if (!fullTranscript) {
        setVoiceStatus('idle');
        return;
      }

      if (field) {
        setForm((prev) => ({
          ...prev,
          [field]: prev[field] ? prev[field] + ' ' + fullTranscript : fullTranscript,
        }));
        setVoiceStatus('done');
      } else {
        processWithAI(fullTranscript);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setVoiceError('Could not start voice recognition. Please try again.');
      setVoiceStatus('error');
    }
  }, [voiceLang]);

  const processWithAI = async (transcript) => {
    setIsParsing(true);
    setVoiceStatus('parsing');
    try {
      const res = await fetch('/api/farmer/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error: ' + res.status);
      }

      const data = await res.json();

      setForm(prev => ({
        ...prev,
        crop: (data.crop && data.crop !== 'null' && CROPS.includes(data.crop)) ? data.crop : prev.crop,
        variety: (data.variety && data.variety !== 'null') ? data.variety : prev.variety,
        quantity: (data.quantity != null && !isNaN(data.quantity)) ? String(data.quantity) : prev.quantity,
        unit: (data.unit === 'kg' || data.unit === 'quintal') ? data.unit : prev.unit,
        price: (data.price != null && !isNaN(data.price)) ? String(data.price) : prev.price,
        harvestDate: (data.harvestDate && data.harvestDate !== 'null') ? data.harvestDate : prev.harvestDate,
        grade: (['A', 'B', 'C'].includes(data.grade)) ? data.grade : prev.grade,
        description: (data.description && data.description !== 'null') ? data.description : prev.description,
      }));

      setVoiceStatus('done');
    } catch (err) {
      console.error('Voice parsing failed:', err);
      setVoiceError('AI processing failed: ' + err.message);
      setVoiceStatus('error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const body = {
      farmerId: user.id,
      farmerName: user.name,
      farmerDistrict: user.district,
      farmerState: user.state,
      crop: form.crop,
      variety: form.variety,
      quantity: Number(form.quantity),
      unit: form.unit,
      price: Number(form.price),
      grade: form.grade,
      harvestDate: form.harvestDate,
      description: form.description,
      photos,
    };
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) router.push('/farmer/my-listings');
  };

  if (loading || !user) return null;

  const getButtonLabel = () => {
    if (isListening) return '🛑 Stop & Process';
    if (isParsing) return '⚙️ AI is filling form...';
    return '🎙️ Click to Speak Your Listing';
  };

  const getButtonBg = () => {
    if (isListening) return '#e53e3e';
    if (isParsing) return '#d97706';
    return '#38a169';
  };

  return (
    <div className="page-container">
      <h1 className="page-title">🌿 List New Produce</h1>
      <form className="card" style={{ maxWidth: '700px' }} onSubmit={handleSubmit}>

        {/* ─── Voice Assistant Card ─── */}
        {speechSupported && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1.5px solid #c6f6d5',
            boxShadow: '0 4px 16px rgba(56, 161, 105, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: '-10px', right: '10px', fontSize: '5rem', opacity: 0.06, transform: 'rotate(10deg)', userSelect: 'none' }}>🎙️</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: '#276749', fontSize: '1.1rem', fontWeight: '700' }}>✨ Magic Voice Assistant</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#4a5568' }}>
                  Speak your full listing — AI fills the form for you!
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '600', padding: '0 4px' }}>Lang:</span>
                <button
                  type="button"
                  onClick={() => setVoiceLang('en-IN')}
                  disabled={isListening}
                  style={{
                    padding: '0.3rem 0.7rem', fontSize: '0.82rem', fontWeight: '600', borderRadius: '6px',
                    backgroundColor: voiceLang === 'en-IN' ? '#38a169' : 'transparent',
                    color: voiceLang === 'en-IN' ? 'white' : '#4a5568',
                    border: 'none', cursor: isListening ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}
                >EN</button>
                <button
                  type="button"
                  onClick={() => setVoiceLang('hi-IN')}
                  disabled={isListening}
                  style={{
                    padding: '0.3rem 0.7rem', fontSize: '0.82rem', fontWeight: '600', borderRadius: '6px',
                    backgroundColor: voiceLang === 'hi-IN' ? '#38a169' : 'transparent',
                    color: voiceLang === 'hi-IN' ? 'white' : '#4a5568',
                    border: 'none', cursor: isListening ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  }}
                >हिन्दी</button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVoiceButtonClick}
              disabled={isParsing}
              style={{
                width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', backgroundColor: getButtonBg(), color: 'white', fontWeight: '700', fontSize: '1rem',
                borderRadius: '10px', border: 'none', cursor: isParsing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isListening ? '0 0 0 4px rgba(229, 62, 62, 0.2)' : '0 2px 8px rgba(56, 161, 105, 0.3)',
              }}
            >
              {getButtonLabel()}
            </button>

            {(isListening || interimText || finalText) && (
              <div style={{
                background: 'white', border: '1px solid #bee3f8', borderRadius: '8px',
                padding: '0.75rem 1rem', minHeight: '50px', fontSize: '0.9rem', color: '#2d3748', lineHeight: '1.6',
              }}>
                {finalText && <span style={{ color: '#276749', fontWeight: '500' }}>{finalText} </span>}
                {interimText && <span style={{ color: '#718096', fontStyle: 'italic' }}>{interimText}</span>}
                {isListening && !finalText && !interimText && (
                  <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Listening... please speak now</span>
                )}
              </div>
            )}

            {isParsing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'linear-gradient(90deg, #38a169, #68d391, #38a169)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.2s linear infinite', borderRadius: '3px',
                  }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#4a5568', whiteSpace: 'nowrap' }}>AI processing...</span>
              </div>
            )}

            {voiceStatus === 'done' && !isListening && !isParsing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#276749', fontSize: '0.88rem', fontWeight: '600' }}>
                ✅ Form filled successfully! Review and adjust fields below if needed.
              </div>
            )}

            {voiceError && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px',
                padding: '0.6rem 0.9rem', color: '#c53030', fontSize: '0.85rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              }}>
                <span>⚠️</span>
                <span>{voiceError}</span>
              </div>
            )}

            {!isListening && !isParsing && voiceStatus === 'idle' && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#718096', lineHeight: '1.5' }}>
                💡 <strong>Tip:</strong> Click the button above and say something like:<br />
                <em>&quot;I want to sell 50 quintals of Sharbati wheat at 2200 rupees, harvested yesterday&quot;</em><br />
                <em>(Hindi: &quot;Mere paas 100 kg tamatar hai, 30 rupees per kg, aaj ka&quot;)</em>
              </p>
            )}
          </div>
        )}

        {/* ─── Form Fields ─── */}
        <div className="form-group">
          <label>Crop</label>
          <select required value={form.crop} onChange={e => update('crop', e.target.value)}>
            <option value="">Select crop</option>
            {CROPS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Variety</label>
          <input value={form.variety} onChange={e => update('variety', e.target.value)} placeholder="e.g. Sharbati, Sona Masuri" />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Quantity</label>
            <input required type="number" value={form.quantity} onChange={e => update('quantity', e.target.value)} placeholder="50" />
          </div>
          <div className="form-group" style={{ flex: 0.5 }}>
            <label>Unit</label>
            <select value={form.unit} onChange={e => update('unit', e.target.value)}>
              <option value="quintal">Quintal</option>
              <option value="kg">Kg</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Harvest Date</label>
            <input required type="date" value={form.harvestDate} onChange={e => update('harvestDate', e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Quality Grade</label>
            <select value={form.grade} onChange={e => update('grade', e.target.value)}>
              <option value="A">A — Premium</option>
              <option value="B">B — Standard</option>
              <option value="C">C — Economy</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Tell buyers about your produce — storage method, pesticide use, unique quality..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Asking Price (₹ per {form.unit || 'quintal'})</label>
          <input required type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="2200" />
        </div>

        {mandiRate && (
          <div style={{ background: 'var(--mist)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--bark)', borderLeft: '4px solid var(--leaf)' }}>
            Today&apos;s mandi rate for <strong>{form.crop}</strong>: <strong>₹{mandiRate.price.toLocaleString('en-IN')}/quintal</strong> at {mandiRate.market} — price your produce fairly.
            <button
              type="button"
              className="btn-secondary"
              onClick={() => update('price', String(mandiRate.price))}
              style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              Use benchmark
            </button>
          </div>
        )}

        <div className="form-group">
          <label>Photos (up to 3)</label>
          <input type="file" accept="image/*" multiple onChange={handlePhoto} />
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {photos.map((p, i) => (
                <img key={i} src={p} alt={'Photo ' + (i + 1)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          Publish Listing
        </button>
      </form>
    </div>
  );
}
