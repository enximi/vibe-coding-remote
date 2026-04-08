export function hapticVibrate(pattern: number | number[] = 50) {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported vibration errors on some mobile browsers.
  }
}
