'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabase, type Chiamata, type Cucina } from '@/lib/supabase'
import { playAlert, resumeAudioContext } from '@/lib/audio'

interface Props {
  cucina: Cucina
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export default function CucinaScreen({ cucina }: Props) {
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [alertAttivo, setAlertAttivo] = useState<Chiamata | null>(null)
  const [coda, setCoda] = useState<Chiamata[]>([])
  const alertTimer1 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alertTimer2 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alertTimerClose = useRef<ReturnType<typeof setTimeout> | null>(null)

  const chiudiAlert = useCallback((chiamata: Chiamata) => {
    setAlertAttivo(null)
    setCoda(prev => {
      const senzaDup = prev.filter(c => c.id !== chiamata.id)
      return [chiamata, ...senzaDup].slice(0, 6)
    })
    if (alertTimer1.current) clearTimeout(alertTimer1.current)
    if (alertTimer2.current) clearTimeout(alertTimer2.current)
    if (alertTimer2.current) clearTimeout(alertTimerClose.current!)
    fetch(`/api/chiamate/${chiamata.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato: 'acknowledged' }),
    }).catch(() => {})
  }, [])

  const attivaAlert = useCallback((chiamata: Chiamata) => {
    if (alertTimer1.current) clearTimeout(alertTimer1.current)
    if (alertTimer2.current) clearTimeout(alertTimer2.current)
    if (alertTimerClose.current) clearTimeout(alertTimerClose.current)

    setAlertAttivo(chiamata)
    playAlert()

    // Ripeti suono a 10 secondi
    alertTimer1.current = setTimeout(() => {
      playAlert()
    }, 10000)

    // Chiudi automaticamente a 30 secondi
    alertTimerClose.current = setTimeout(() => {
      chiudiAlert(chiamata)
    }, 30000)
  }, [chiudiAlert])

  // Carica ultime chiamate storiche
  useEffect(() => {
    fetch(`/api/chiamate?cucina=${cucina}`)
      .then(r => r.json())
      .then((data: Chiamata[]) => {
        const acknowledged = data
          .filter(c => c.stato === 'acknowledged')
          .slice(0, 6)
        setCoda(acknowledged)
      })
      .catch(() => {})
  }, [cucina])

  // Supabase Realtime subscription
  useEffect(() => {
    const sb = getSupabase()
    const channel = sb
      .channel(`chiamate-${cucina}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiamate',
          filter: `cucina_target=eq.${cucina}`,
        },
        (payload) => {
          const chiamata = payload.new as Chiamata
          if (audioEnabled) {
            attivaAlert(chiamata)
          } else {
            setCoda(prev => [chiamata, ...prev].slice(0, 6))
          }
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [cucina, audioEnabled, attivaAlert])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (alertTimer1.current) clearTimeout(alertTimer1.current)
      if (alertTimer2.current) clearTimeout(alertTimer2.current)
      if (alertTimerClose.current) clearTimeout(alertTimerClose.current)
    }
  }, [])

  function attivaAudio() {
    resumeAudioContext()
    setAudioEnabled(true)
  }

  const label = cucina === 'interna' ? 'Cucina Interna' : 'Cucina Esterna'
  const colorScheme = cucina === 'interna'
    ? { bg: 'bg-gray-900', accent: 'text-orange-400', badge: 'bg-orange-600' }
    : { bg: 'bg-gray-900', accent: 'text-red-400', badge: 'bg-red-700' }

  // Overlay attivazione audio
  if (!audioEnabled) {
    return (
      <div
        className={`min-h-screen ${colorScheme.bg} flex flex-col items-center justify-center cursor-pointer select-none`}
        onClick={attivaAudio}
      >
        <div className="text-center p-12">
          <div className="text-8xl mb-8">{cucina === 'interna' ? '🍳' : '🔥'}</div>
          <h1 className={`text-5xl font-bold ${colorScheme.accent} mb-6`}>{label}</h1>
          <div className="bg-gray-800 rounded-3xl px-12 py-8 mt-4">
            <p className="text-white text-4xl font-bold">Tocca per attivare</p>
            <p className="text-gray-400 text-2xl mt-3">Necessario per abilitare i suoni di allerta</p>
          </div>
        </div>
      </div>
    )
  }

  // Alert attivo
  if (alertAttivo) {
    return (
      <div className="min-h-screen alert-pulse flex flex-col items-center justify-center p-8 select-none">
        <div className="text-center">
          <p className="text-white text-3xl font-bold mb-6 uppercase tracking-widest opacity-80">
            RICHIESTA URGENTE
          </p>
          <h2
            className="text-white font-black leading-none mb-12"
            style={{ fontSize: 'clamp(4rem, 15vw, 12rem)' }}
          >
            {alertAttivo.pietanza_nome}
          </h2>
          <button
            onClick={() => chiudiAlert(alertAttivo)}
            className="bg-white text-red-700 font-black text-4xl px-16 py-8 rounded-3xl shadow-2xl active:scale-95 transition-transform hover:bg-gray-100"
          >
            ✓ RICEVUTO
          </button>
          <p className="text-white text-xl mt-8 opacity-70">
            Si chiude automaticamente in 30 secondi
          </p>
        </div>
      </div>
    )
  }

  // Stato normale
  return (
    <div className={`min-h-screen ${colorScheme.bg} flex flex-col`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-6 border-b border-gray-800`}>
        <h1 className={`text-4xl font-bold ${colorScheme.accent}`}>
          {cucina === 'interna' ? '🍳' : '🔥'} {label}
        </h1>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-green-400 text-xl">In attesa</span>
        </div>
      </div>

      {/* Area principale */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-6">{cucina === 'interna' ? '🍳' : '🔥'}</div>
          <p className="text-gray-500 text-3xl">Nessuna richiesta in corso</p>
        </div>
      </div>

      {/* Coda ultime chiamate */}
      {coda.length > 0 && (
        <div className="px-8 py-6 border-t border-gray-800">
          <h3 className="text-gray-400 text-xl font-bold mb-4 uppercase tracking-wider">
            Ultime chiamate
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {coda.map((c, i) => (
              <div
                key={c.id}
                className={`bg-gray-800 rounded-xl p-3 text-center ${i === 0 ? 'ring-2 ring-gray-600' : ''}`}
              >
                <p className="text-white text-lg font-bold leading-tight">{c.pietanza_nome}</p>
                <p className="text-gray-400 text-sm mt-1">{formatTime(c.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
