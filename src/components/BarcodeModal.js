import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeModal({ onDetect, onClose }) {
  const scannerRef = useRef(null);
  const activeRef = useRef(true);
  const onDetectRef = useRef(onDetect);

  useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);

  useEffect(() => {
    const scanner = new Html5Qrcode('wiq-barcode-reader');
    scannerRef.current = scanner;
    activeRef.current = true;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decoded) => {
          if (!activeRef.current) return;
          activeRef.current = false;
          onDetectRef.current(decoded);
        },
        () => {}
      )
      .catch((err) => console.warn('Camera start error:', err));

    return () => {
      activeRef.current = false;
      scanner.stop().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Scan Barcode</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close scanner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div id="wiq-barcode-reader" className="scanner-container" />
        <p className="scan-hint">Point your camera at a product barcode</p>
      </div>
    </div>
  );
}
