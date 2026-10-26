// The visual part of an on/off switch. The caller's <button role="switch">
// carries the label, aria-checked and the click handler.
export function SwitchTrack({ on, size = 'md' }: { on: boolean; size?: 'sm' | 'md' }) {
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <span
      aria-hidden
      className={`inline-flex ${track} shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
    >
      <span className={`${knob} rounded-full bg-white shadow-sm transition-transform ${on ? shift : 'translate-x-0'}`} />
    </span>
  );
}
