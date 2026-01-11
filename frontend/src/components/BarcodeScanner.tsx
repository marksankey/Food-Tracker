import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './BarcodeScanner.css';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const startScanner = async () => {
      try {
        setError('');

        // Initialize scanner
        const scanner = new Html5Qrcode('barcode-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        // Get camera list and use the back camera if available
        const cameras = await Html5Qrcode.getCameras();
        let cameraId = cameras[0]?.id;

        // Try to find the back/rear camera (better for scanning)
        const backCamera = cameras.find(
          (camera) =>
            camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
        );

        if (backCamera) {
          cameraId = backCamera.id;
        }

        // Start scanning
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Successfully scanned a barcode
            onScan(decodedText);
            stopScanner();
          },
          (_errorMessage) => {
            // Scanning errors (expected when no barcode in view)
            // We can ignore these
          }
        );
      } catch (err: any) {
        console.error('Scanner error:', err);
        setError(
          err.message || 'Failed to start camera. Please check permissions.'
        );
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, [onScan]);

  const handleClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    onClose();
  };

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="scanner-header">
          <h3>Scan Barcode</h3>
          <button onClick={handleClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="scanner-body">
          {error ? (
            <div className="scanner-error">
              <p>{error}</p>
              <button onClick={handleClose} className="btn btn-primary">
                Close
              </button>
            </div>
          ) : (
            <>
              <div id="barcode-reader" className="barcode-reader-container"></div>
              <div className="scanner-instructions">
                <p>Position the barcode within the frame</p>
                <p className="scanner-tip">
                  Make sure the barcode is well-lit and in focus
                </p>
              </div>
            </>
          )}
        </div>

        <div className="scanner-footer">
          <button onClick={handleClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
