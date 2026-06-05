let audioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function playAlert() {
  const ctx = getAudioContext()

  // Compressor to maximize perceived loudness without clipping
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -6
  compressor.knee.value = 0
  compressor.ratio.value = 20
  compressor.attack.value = 0.001
  compressor.release.value = 0.1
  compressor.connect(ctx.destination)

  const playTone = (freq: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(compressor)

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(freq, startTime)

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.005)
    gainNode.gain.setValueAtTime(1.0, startTime + duration - 0.01)
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }

  // 6 beep bitonali ravvicinati: 3 acuti + pausa breve + 3 gravi più lunghi
  const now = ctx.currentTime
  const ON = 0.1   // durata beep
  const OFF = 0.07 // silenzio tra beep

  playTone(1200, now,                             ON)
  playTone(1200, now + ON + OFF,                  ON)
  playTone(1200, now + (ON + OFF) * 2,            ON)
  // pausa leggermente più lunga tra i due gruppi
  playTone(880,  now + (ON + OFF) * 3 + 0.05,    ON + 0.05)
  playTone(880,  now + (ON + OFF) * 3 + 0.05 + (ON + 0.05 + OFF), ON + 0.05)
  playTone(880,  now + (ON + OFF) * 3 + 0.05 + (ON + 0.05 + OFF) * 2, ON + 0.1)
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}
