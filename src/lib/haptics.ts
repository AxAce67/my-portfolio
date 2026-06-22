// Real device vibration on tap, with two layers since no single API
// covers every browser:
// - navigator.vibrate() works on Android (Chrome, Samsung Internet, etc.)
//   but Safari/WebKit has never implemented it — and every iOS browser
//   (including Chrome/Firefox on iOS) is WebKit under the hood, so it's a
//   dead end there.
// - iOS 18+ Safari/WebKit gives real system haptic feedback when a
//   `<input type="checkbox" switch>` toggles, even though that's not
//   exposed through any vibration API. We keep one hidden switch around
//   and click its label to flip it, purely to trigger that side effect.
let hiddenSwitchLabel: HTMLLabelElement | null = null;

function getHiddenSwitchLabel(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (hiddenSwitchLabel) return hiddenSwitchLabel;

  const label = document.createElement('label');
  label.style.position = 'fixed';
  label.style.width = '0';
  label.style.height = '0';
  label.style.overflow = 'hidden';
  label.style.opacity = '0';
  label.style.pointerEvents = 'none';
  label.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;

  label.appendChild(input);
  document.body.appendChild(label);
  hiddenSwitchLabel = label;
  return label;
}

export function triggerHaptic(durationMs = 8) {
  if (typeof window === 'undefined') return;

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(durationMs);
    return;
  }

  getHiddenSwitchLabel()?.click();
}
