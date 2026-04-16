import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { CloseIcon } from './icons';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
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

    const codeReader = new BrowserQRCodeReader();
    let isMounted = true;

    const streamPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (!isMounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (!isMounted) return;
            if (result) {
              onScan(result.getText());
            }
            if (err && err.name === 'NotAllowedError') {
              setError('请允许使用摄像头权限');
            }
          });
        }
      return stream;
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setError('无法启动摄像头: ' + err.message);
      });

    return () => {
      isMounted = false;
      streamPromise.then(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
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
