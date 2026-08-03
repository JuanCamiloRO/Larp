// components/ScanBarcodeButton.jsx
// Self-contained trigger + scanner pair. Renders a "Scan Barcode" button;
// tapping it opens the full-screen BarcodeScanner overlay. On a successful
// detection + food lookup, the scanner closes itself automatically and
// hands the found food up via onFoodFound -- the parent doesn't need to
// manage any open/closed state itself.

import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

export default function ScanBarcodeButton({ onFoodFound }) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  function handleFoodFound(food) {
    setIsScannerOpen(false); // close as soon as a real result comes back
    onFoodFound(food);
  }

  function handleCancel() {
    setIsScannerOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary scan-barcode-btn"
        onClick={() => setIsScannerOpen(true)}
      >
        <ScanLine size={16} strokeWidth={2.5} />
        <span>Scan Barcode</span>
      </button>

      {isScannerOpen && (
        <BarcodeScanner onFoodFound={handleFoodFound} onCancel={handleCancel} />
      )}
    </>
  );
}