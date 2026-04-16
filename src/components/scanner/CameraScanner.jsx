import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Loader2 } from 'lucide-react';

export default function CameraScanner({ onScan }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastScanRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    BrowserMultiFormatReader.listVideoInputDevices().then((devices) => {
      // Préférer la caméra arrière
      const back = devices.find((d) =>
        /back|rear|environment/i.test(d.label)
      ) || devices[devices.length - 1];

      if (!back) {
        setError('Aucune caméra trouvée');
        setLoading(false);
        return;
      }

      reader.decodeFromVideoDevice(
        back.deviceId,
        videoRef.current,
        (result, err, controls) => {
          controlsRef.current = controls;
          setLoading(false);
          if (result) {
            const text = result.getText().replace(/[^0-9]/g, '');
            const now = Date.now();
            // Anti-doublon : ignorer si même EAN scanné dans les 2s
            if (text.length >= 8 && (text !== lastScanRef.current || now - lastTimeRef.current > 2000)) {
              lastScanRef.current = text;
              lastTimeRef.current = now;
              onScan(text);
            }
          }
        }
      ).catch((e) => {
        setError('Impossible d\'accéder à la caméra : ' + e.message);
        setLoading(false);
      });
    }).catch(() => {
      setError('Erreur d\'accès aux caméras');
      setLoading(false);
    });

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
      <video ref={videoRef} className="w-full h-full object-cover" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <p className="text-white text-sm text-center">{error}</p>
        </div>
      )}

      {/* Viseur */}
      {!loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-32 border-2 border-white/70 rounded-lg">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-violet rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-violet rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-violet rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-violet rounded-br-lg" />
          </div>
        </div>
      )}
    </div>
  );
}