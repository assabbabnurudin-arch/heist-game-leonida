// Sound, synthesised with WebAudio — no audio files, no network. A tiny
// helper plays short tones; the game calls it for pickups, alarms and wins.
// Audio starts only after the first user gesture, as browsers require.

let ctx = null;
let alarmTimer = null;
let muted = false;

// M toggles all sound. The game calls this when the player presses M.
export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarmSound();
  return muted;
}

export function isMuted() {
  return muted;
}

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Satisfying loot pickup: a bright two-note chime.
export function playPickup() {
  tone(880, 0.12, 'sine', 0.16);
  tone(1318, 0.18, 'sine', 0.14, 0.07);
}

// Spotted sting: a short dissonant blip when suspicion first spikes.
export function playSpotted() {
  tone(220, 0.16, 'square', 0.08);
  tone(233, 0.16, 'square', 0.08, 0.02);
}

// Alarm: two alternating siren tones while the alarm runs.
export function startAlarmSound() {
  if (muted || alarmTimer !== null) return;
  let high = false;
  alarmTimer = window.setInterval(() => {
    high = !high;
    tone(high ? 660 : 440, 0.32, 'sawtooth', 0.045);
  }, 340);
}

export function stopAlarmSound() {
  if (alarmTimer !== null) {
    window.clearInterval(alarmTimer);
    alarmTimer = null;
  }
}

// Level-clear fanfare: a rising four-note arpeggio.
export function playLevelClear() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.09));
}

// Busted: a low descending buzz.
export function playBusted() {
  tone(160, 0.5, 'sawtooth', 0.12);
  tone(110, 0.6, 'sawtooth', 0.12, 0.18);
}

// Coin toss: a soft metallic tick.
export function playCoin() {
  tone(2400, 0.05, 'square', 0.05);
}
