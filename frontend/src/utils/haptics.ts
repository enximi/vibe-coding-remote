export function hapticVibrate(pattern: number | number[] = 50) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}
