// components/BarcodeScanner.jsx
import { useEffect, useRef, useState } from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { useFoodLookup } from '../hooks/useFoodLookup';

export default function BarcodeScanner({ onFoodFound, onCancel }) {
  const viewportRef = useRef(null);
  const { startScan, stopScan } = useBarcodeScanner();
  const { lookupBarcode, loading, error } = useFoodLookup();
  const [status, setStatus] = useState('Point your camera at a barcode');
  const hasHandledScan = useRef(false);

  useEffect(() => {
    startScan(viewportRef.current, handleDetected);
    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDetected(barcode) {
    console.log('Quagga raw detection:', barcode, typeof barcode, barcode.length);
    if (hasHandledScan.current) return;
    hasHandledScan.current = true;

    stopScan();
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

  // Explicitly stop the camera BEFORE telling the parent to close this
  // component. Don't rely solely on unmount cleanup to release hardware.
  function handleCancel() {
    stopScan();
    onCancel();
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-viewport"
  ref={viewportRef}
  style={{ width: '100%', height: '400px', minHeight: '400px' }} />

      <div className="scanner-status-bar">
        <p className="subtle">{loading ? 'Looking up product...' : status}</p>
        {error && <p className="message error">{error}</p>}
      </div>

      <button className="btn-secondary scanner-cancel-btn" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  );
}