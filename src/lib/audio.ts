let audioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function playAlert() {
  const ctx = getAudioContext()

  const playTone = (freq: number, startTime: number, duration: number, volume = 0.8) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(freq, startTime)

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05)
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }

  const now = ctx.currentTime
  // Pattern: tre beep urgenti
  playTone(880, now, 0.15)
  playTone(880, now + 0.2, 0.15)
  playTone(1100, now + 0.4, 0.3)
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}
