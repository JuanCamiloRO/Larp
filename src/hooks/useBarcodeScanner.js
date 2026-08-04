// hooks/useBarcodeScanner.js
import { useRef, useCallback } from 'react';
import { BarcodeDetector } from '@sec-ant/barcode-detector/pure';

const SUPPORTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const SCAN_INTERVAL_MS = 200;

export function useBarcodeScanner() {
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const detectorRef = useRef(null);
  const isRunning = useRef(false);

  const startScan = useCallback(async (targetElement, onDetect) => {
    if (isRunning.current || !targetElement) return;
    isRunning.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.setAttribute('playsinline', ''); // required to avoid iOS fullscreen takeover
      video.muted = true;
      video.srcObject = stream;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';

      targetElement.innerHTML = '';
      targetElement.appendChild(video);
      videoRef.current = video;

      await video.play();

      // offscreen canvas used to grab a still frame each tick --
      // the WASM fallback detector seems to need a captured image
      // (canvas/ImageData) rather than a live <video> element
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      detectorRef.current = new BarcodeDetector({ formats: SUPPORTED_FORMATS });

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        if (!vw || !vh) return;

        canvas.width = vw;
        canvas.height = vh;
        ctx.drawImage(videoRef.current, 0, 0, vw, vh);

        try {
          const barcodes = await detectorRef.current.detect(canvas);
          if (barcodes.length > 0) {
            onDetect(barcodes[0].rawValue);
          }
        } catch (err) {
          console.error('Barcode detect error:', err);
        }
      }, SCAN_INTERVAL_MS);
    } catch (err) {
      console.error('Camera start error:', err);
      isRunning.current = false;
    }
  }, []);

  const stopScan = useCallback(() => {
    if (!isRunning.current) return;

    clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.remove();
      videoRef.current = null;
    }

    canvasRef.current = null;
    detectorRef.current = null;
    isRunning.current = false;
  }, []);

  return { startScan, stopScan };
}