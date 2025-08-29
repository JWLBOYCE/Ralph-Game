export type InteractionType = 'pet' | 'treat' | 'play' | 'play_ball' | 'bark' | 'belly_rub' | 'jump';

let audioCtx: (AudioContext | null) = null;
let barkBuffers: AudioBuffer[] = [];
let barkPreloadPromise: Promise<void> | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    // @ts-ignore - webkit prefix for older Safari
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  if (!ctx) throw new Error('No AudioContext');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audio: ' + url);
  const arr = await res.arrayBuffer();
  return await ctx.decodeAudioData(arr);
}

async function ensureBarkBuffers(): Promise<void> {
  if (barkBuffers.length > 0) return;
  if (!barkPreloadPromise) {
    barkPreloadPromise = (async () => {
      const candidates = [
        '/sounds/bark1.mp3',
        '/sounds/bark2.mp3',
        '/sounds/bark3.mp3',
        '/sounds/bark4.mp3',
        '/sounds/bark.mp3', // legacy single file name
      ];
      const loaded: AudioBuffer[] = [];
      for (const url of candidates) {
        try {
          const buf = await loadAudioBuffer(url);
          loaded.push(buf);
        } catch { /* ignore */ }
      }
      barkBuffers = loaded;
    })();
  }
  await barkPreloadPromise;
}

function playBarkSample() {
  const ctx = getAudioContext();
  if (!ctx) return;
  ensureBarkBuffers().then(() => {
    if (barkBuffers.length > 0) {
      try {
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createBufferSource();
        const buf = barkBuffers[(Math.random() * barkBuffers.length) | 0];
        src.buffer = buf;
        // Slight randomization for variety
        src.playbackRate.value = 0.9 + Math.random() * 0.2;
        const gain = ctx.createGain();
        gain.gain.value = 0.7;
        src.connect(gain).connect(ctx.destination);
        src.start();
      } catch { /* ignore */ }
      return;
    }
    // Fallback: synthesize a bark-like sound (two short bursts with a pitch drop + noise)
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      const burst = (t0: number) => {
        const osc = ctx.createOscillator();
        const noise = ctx.createBufferSource();
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 900;
        bp.Q.value = 6;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.8, t0);
        g.gain.exponentialRampToValueAtTime(0.01, t0 + 0.18);

        osc.frequency.setValueAtTime(220, t0);
        osc.frequency.exponentialRampToValueAtTime(130, t0 + 0.18);
        osc.type = 'triangle';

        noise.connect(bp);
        osc.connect(bp);
        bp.connect(g).connect(master);

        osc.start(t0);
        noise.start(t0);
        osc.stop(t0 + 0.2);
        noise.stop(t0 + 0.2);
      };

      const t = ctx.currentTime;
      burst(t);
      burst(t + 0.12);
    } catch { /* ignore */ }
  });
}

export function playInteractionTone(type: InteractionType) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (type === 'bark') {
      playBarkSample();
      return;
    }
    if (ctx.state === 'suspended') ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    let frequency = 400;
    switch (type) {
      case 'pet': frequency = 600; break;
      case 'treat': frequency = 500; break;
      case 'play':
      case 'play_ball': frequency = 700; break;
      case 'jump': frequency = 650; break;
      case 'belly_rub': frequency = 300; break;
      default: frequency = 450; break;
    }

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // no-op
  }
}

export function vibratePulse(ms = 20) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
}

export async function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    // Try local samples first
    const choices = ['/sounds/success1.mp3','/sounds/success2.mp3','/sounds/success3.mp3'];
    const ok: AudioBuffer[] = [];
    for (const p of choices) {
      try { ok.push(await loadAudioBuffer(p)); } catch {}
    }
    if (ok.length) {
      const src = ctx.createBufferSource();
      src.buffer = ok[(Math.random()*ok.length)|0];
      const g = ctx.createGain(); g.gain.value = 0.6;
      src.connect(g).connect(ctx.destination);
      src.start();
      return;
    }
  } catch {}

  // Fallback: synth chime (two quick notes)
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const g = ctx.createGain(); g.gain.value = 0.15; g.connect(ctx.destination);
    const o1 = ctx.createOscillator(); o1.type = 'sine';
    const o2 = ctx.createOscillator(); o2.type = 'sine';
    o1.connect(g); o2.connect(g);
    const t = ctx.currentTime;
    o1.frequency.setValueAtTime(880, t);
    o1.start(t); o1.stop(t + 0.12);
    o2.frequency.setValueAtTime(1175, t + 0.1);
    o2.start(t + 0.1); o2.stop(t + 0.25);
  } catch {}
}

export async function playAnimalApproval(species: string) {
  const ctx = getAudioContext();
  if (!ctx) return playSuccessChime();
  const candidates = [
    `/sounds/approve-${species.toLowerCase()}.mp3`,
    `/sounds/${species.toLowerCase()}-approve.mp3`,
  ];
  for (const url of candidates) {
    try {
      const buf = await loadAudioBuffer(url);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      src.connect(g).connect(ctx.destination);
      src.start();
      return;
    } catch {}
  }
  await playSuccessChime();
}

let ambientStarted = false
export async function startAmbient() {
  if (ambientStarted) return
  ambientStarted = true
  const ctx = getAudioContext();
  if (!ctx) return
  try {
    const urls = ['/sounds/ambient-wind.mp3','/sounds/ambient-birds.mp3']
    const bufs: AudioBuffer[] = []
    for (const u of urls) { try { bufs.push(await loadAudioBuffer(u)) } catch {} }
    if (!bufs.length) return
    const g = ctx.createGain(); g.gain.value = 0.08; g.connect(ctx.destination)
    for (const b of bufs) {
      const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(g); s.start()
    }
  } catch {}
}
