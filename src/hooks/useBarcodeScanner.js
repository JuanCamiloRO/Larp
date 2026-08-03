// hooks/useBarcodeScanner.js
import { useRef, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';

export function useBarcodeScanner() {
  const isRunning = useRef(false);
  const containerRef = useRef(null);

  const startScan = useCallback((targetElement, onDetect) => {
    if (isRunning.current || !targetElement) return;

    // Wait until the element actually has real dimensions before
    // handing it to Quagga -- prevents the "must be a multiple of NaN"
    // error caused by initializing against a 0x0 element.
    if (targetElement.offsetWidth === 0 || targetElement.offsetHeight === 0) {
        console.log('Waiting for element size...', targetElement.offsetWidth, targetElement.offsetHeight);
      requestAnimationFrame(() => startScan(targetElement, onDetect));
      return;
    }

    containerRef.current = targetElement;

    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: targetElement,
          constraints: {
            facingMode: 'environment',
            width: { min: 640 },
            height: { min: 480 },
          },
        },
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          return;
        }
        Quagga.start();
        isRunning.current = true;
      }
    );

    Quagga.onDetected((result) => {
      const code = result?.codeResult?.code;
      if (code) {
        onDetect(code);
      }
    });
  }, []);

  const stopScan = useCallback(() => {
    if (!isRunning.current) return;
    Quagga.offDetected();
    Quagga.stop();
    try {
      Quagga.CameraAccess.release();
    } catch (e) {}

    const container = containerRef.current;
    if (container) {
      const videoEl = container.querySelector('video');
      if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    }
    isRunning.current = false;
  }, []);

  return { startScan, stopScan };
}