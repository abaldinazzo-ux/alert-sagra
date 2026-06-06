'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabase, type Chiamata, type Cucina } from '@/lib/supabase'
import { playAlert, resumeAudioContext } from '@/lib/audio'
import HomeButton from '@/components/HomeButton'

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
      return [chiamata, ...senzaDup].slice(0, 5)
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
          .slice(0, 5)
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
            setCoda(prev => [chiamata, ...prev].slice(0, 5))
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
  const scheme = cucina === 'interna'
    ? {
        bg: 'bg-gray-950',
        accent: 'text-orange-400',
        rowBg: 'bg-orange-950',
        rowBgAlt: 'bg-orange-900',
        rowBorder: 'border-orange-700',
        timeFg: 'text-orange-300',
      }
    : {
        bg: 'bg-gray-950',
        accent: 'text-red-400',
        rowBg: 'bg-red-950',
        rowBgAlt: 'bg-red-900',
        rowBorder: 'border-red-700',
        timeFg: 'text-red-300',
      }

  // Overlay attivazione audio
  if (!audioEnabled) {
    return (
      <div
        className={`min-h-screen ${scheme.bg} flex flex-col items-center justify-center cursor-pointer select-none`}
        onClick={attivaAudio}
      >
        <HomeButton />
        <div className="text-center p-12">
          <div className="text-8xl mb-8">{cucina === 'interna' ? '🍳' : '🔥'}</div>
          <h1 className={`text-5xl font-bold ${scheme.accent} mb-6`}>{label}</h1>
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
        <HomeButton />
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

  // Stato normale — coda a tutto schermo
  return (
    <div className={`h-screen ${scheme.bg} flex flex-col overflow-hidden`}>
      <HomeButton />
      {/* Header compatto */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-gray-800 shrink-0">
        <h1 className={`text-2xl font-bold ${scheme.accent}`}>
          {cucina === 'interna' ? '🍳' : '🔥'} {label}
        </h1>
        <div className="flex items-center gap-4">
          {coda.length > 0 && (
            <button
              onClick={() => setCoda([])}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              🗑 Pulisci coda
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-400 text-lg">In attesa</span>
          </div>
        </div>
      </div>

      {/* Coda a tutto schermo */}
      <div className="flex-1 flex flex-col min-h-0">
        {coda.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-4xl font-semibold">In attesa di chiamate...</p>
          </div>
        ) : (
          coda.map((c, i) => (
            <div
              key={c.id}
              className={`
                flex-1 flex items-center px-10 gap-8 min-h-0
                border-b border-opacity-30 ${scheme.rowBorder}
                ${i % 2 === 0 ? scheme.rowBg : scheme.rowBgAlt}
              `}
            >
              {/* Numero posizione */}
              <span className="text-gray-500 font-black shrink-0 select-none"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                {i + 1}
              </span>

              {/* Nome pietanza */}
              <span
                className="text-white font-black leading-none flex-1 truncate"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
              >
                {c.pietanza_nome}
              </span>

              {/* Orario */}
              <span
                className={`${scheme.timeFg} font-bold shrink-0 tabular-nums`}
                style={{ fontSize: 'clamp(1.8rem, 4vw, 4rem)' }}
              >
                {formatTime(c.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
