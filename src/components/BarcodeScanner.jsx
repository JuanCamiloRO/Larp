// components/BarcodeScanner.jsx

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { useFoodLookup } from '../hooks/useFoodLookup';
import '../css/scanner.css';

export default function BarcodeScanner({ onFoodFound, onCancel }) {
  const viewportRef = useRef(null);
  const { startScan, stopScan } = useBarcodeScanner();
  const { lookupBarcode, loading, error } = useFoodLookup();
  const [status, setStatus] = useState('Point your camera at a barcode');
  const hasHandledScan = useRef(false);

  useEffect(() => {
    startScan(viewportRef.current, handleDetected);
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDetected(barcode) {
    if (hasHandledScan.current) return;
    hasHandledScan.current = true;

    await stopScan();
    setStatus(`Looking up ${barcode}...`);

    const food = await lookupBarcode(barcode);

    if (food) {
      onFoodFound(food);
    } else {
      setStatus('Product not found. Try scanning again.');
      hasHandledScan.current = false;
      startScan(viewportRef.current, handleDetected);
    }
  }

  async function handleCancel() {
    await stopScan();
    onCancel();
  }

  return (
    <div className="scanner-overlay">
      <header className="scanner-topbar">
        <button className="scanner-back" onClick={handleCancel} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1>Scan a Barcode</h1>
        <span aria-hidden="true" />
      </header>

      <div className="scanner-viewport" ref={viewportRef}>
        <div className="scanner-frame">
          <span className="scanner-corner scanner-corner-tl" />
          <span className="scanner-corner scanner-corner-tr" />
          <span className="scanner-corner scanner-corner-bl" />
          <span className="scanner-corner scanner-corner-br" />
          <div className="scanner-scanline" />
        </div>
      </div>

      <div className="scanner-status-bar">
        <p className="subtle">{loading ? 'Looking up product...' : status}</p>
        {error && <p className="message error">{error}</p>}
      </div>
    </div>
  );
}