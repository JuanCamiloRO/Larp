// components/ScanBarcodeButton.jsx
// Self-contained trigger + scanner pair. Renders a "Scan Barcode" button;
// tapping it opens the full-screen BarcodeScanner overlay. On a successful
// detection + food lookup, the scanner closes itself automatically and
// hands the found food up via onFoodFound.

import { useState } from 'react';
import { QrCode } from 'lucide-react';
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
        className="meal-icon-btn"
        onClick={() => setIsScannerOpen(true)}
      >
        <QrCode size={20} strokeWidth={2.5} />
      </button>

      {isScannerOpen && (
        <BarcodeScanner onFoodFound={handleFoodFound} onCancel={handleCancel} />
      )}
    </>
  );
}