import React, { useState, useRef } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function SearchBar({ value, onChange, onSearch, onScanClick }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch(value.trim());
  };

  const startVoice = () => {
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Try Chrome on Android.');
      return;
    }
    const r = new SpeechRecognition();
    r.lang = 'en-AU';
    r.interimResults = false;
    r.maxAlternatives = 1;
    recRef.current = r;

    r.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      onChange(text);
      setListening(false);
      onSearch(text);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
    setListening(true);
  };

  const stopVoice = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <div className="search-row">
        <input
          className="search-input"
          type="search"
          inputMode="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Part ID…"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Part ID search"
        />
        <button
          type="button"
          className={`icon-btn${listening ? ' listening' : ''}`}
          onClick={listening ? stopVoice : startVoice}
          aria-label={listening ? 'Stop listening' : 'Voice search'}
          title={listening ? 'Stop listening' : 'Voice search'}
        >
          <MicIcon active={listening} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onScanClick}
          aria-label="Scan barcode"
          title="Scan barcode"
        >
          <ScanIcon />
        </button>
      </div>
      <button type="submit" className="search-btn">
        SEARCH
      </button>
    </form>
  );
}

function MicIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#EF4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="16" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <line x1="16" y1="16" x2="22" y2="22" />
      <line x1="16" y1="22" x2="22" y2="16" />
      <line x1="11" y1="4" x2="13" y2="4" />
      <line x1="11" y1="20" x2="13" y2="20" />
      <line x1="4" y1="11" x2="4" y2="13" />
      <line x1="20" y1="11" x2="20" y2="13" />
    </svg>
  );
}
