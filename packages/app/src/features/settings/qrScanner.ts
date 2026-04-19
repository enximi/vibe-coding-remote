import type { BrowserQRCodeReader as BrowserQRCodeReaderType } from '@zxing/browser';

export async function createQrCodeReader(): Promise<BrowserQRCodeReaderType> {
  const [
    { BrowserQRCodeReader, HTMLCanvasElementLuminanceSource },
    { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer },
  ] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);

  class InvertedFallbackQRCodeReader extends BrowserQRCodeReader {
    override decodeFromCanvas(canvas: HTMLCanvasElement) {
      try {
        return super.decodeFromCanvas(canvas);
      } catch (originalError) {
        const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas).invert();
        const invertedBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        try {
          return this.decodeBitmap(invertedBitmap);
        } catch {
          throw originalError;
        }
      }
    }
  }

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new InvertedFallbackQRCodeReader(hints, {
    delayBetweenScanAttempts: 120,
    delayBetweenScanSuccess: 400,
    tryPlayVideoTimeout: 8000,
  });
}
