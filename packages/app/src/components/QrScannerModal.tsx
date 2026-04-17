import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (text: string) => boolean;
}

export function QrScannerModal({ isOpen, onClose, onScan }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('当前环境不支持摄像头扫码');
      return;
    }

    if (!isOpen || !videoRef.current) {
      return;
    }

    let isMounted = true;
    let isScanAccepted = false;
    let scannerControls:
      | {
          stop: () => void;
        }
      | null = null;
    let lastRejectedValue = '';

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    const scannerPromise = Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ])
      .then(([{ BrowserQRCodeReader }, { BarcodeFormat, DecodeHintType }]) => {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        return new BrowserQRCodeReader(hints, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 400,
          tryPlayVideoTimeout: 8000,
        });
      })
      .then(async (codeReader) => {
        if (!isMounted || !videoRef.current) {
          return;
        }

        scannerControls = await codeReader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
          if (!isMounted) return;

          if (result) {
            const rawValue = result.getText();
            if (onScan(rawValue)) {
              isScanAccepted = true;
              scannerControls?.stop();
              return;
            }

            if (rawValue !== lastRejectedValue) {
              lastRejectedValue = rawValue;
              setError('识别到了二维码，但不是 Vibe Coding Remote 配置二维码');
            }
          }

          if (err && err.name === 'NotAllowedError') {
            setError('请允许使用摄像头权限');
          }
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setError('无法启动摄像头: ' + err.message);
      });

    return () => {
      isMounted = false;
      scannerControls?.stop();
      if (!isScanAccepted) {
        setError(null);
      }
      void scannerPromise;
    };
  }, [isOpen, onScan]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="modal-content qr-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">扫码导入配置</h2>
          <button className="close-btn" type="button" onClick={onClose} aria-label="关闭">
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <div className="qr-scanner-container">
          <div className="qr-scanner-frame">
            <video ref={videoRef} className="qr-video" muted playsInline />
            <div className="qr-overlay" />
          </div>
          {error && <p className="settings-error" style={{ textAlign: 'center' }}>{error}</p>}
          <p className="settings-hint" style={{ textAlign: 'center', marginTop: 16 }}>
            请将电脑端服务器显示的二维码放入框内
          </p>
        </div>
      </div>
    </div>
  );
}
