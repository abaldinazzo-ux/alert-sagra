'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Pietanza } from '@/lib/supabase'
import HomeButton from '@/components/HomeButton'

export default function DistribuzionePage() {
  const [pietanze, setPietanze] = useState<Pietanza[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ id: number; ok: boolean } | null>(null)

  async function fetchPietanze() {
    const res = await fetch('/api/pietanze')
    const data: Pietanza[] = await res.json()
    setPietanze(data.filter(p => p.attiva))
    setLoading(false)
  }

  useEffect(() => {
    fetchPietanze()
  }, [])

  async function chiamaCucina(p: Pietanza) {
    if (sending !== null) return
    setSending(p.id)
    try {
      const res = await fetch('/api/chiamate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pietanza_id: p.id,
          pietanza_nome: p.nome,
          cucina_target: p.cucina,
        }),
      })
      setFeedback({ id: p.id, ok: res.ok })
      setTimeout(() => setFeedback(null), 2000)
    } finally {
      setSending(null)
    }
  }

  const interne = pietanze.filter(p => p.cucina === 'interna')
  const esterne = pietanze.filter(p => p.cucina === 'esterna')

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <HomeButton />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">📢 Distribuzione</h1>
        </div>

        {loading && (
          <p className="text-gray-400 text-2xl text-center py-20">Caricamento...</p>
        )}

        {!loading && pietanze.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-2xl mb-4">Nessuna pietanza attiva.</p>
            <Link href="/admin" className="text-blue-400 hover:text-blue-300 text-xl underline">
              Vai all&apos;admin per aggiungerne
            </Link>
          </div>
        )}

        {interne.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">🍳 Cucina Interna</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {interne.map(p => (
                <PietanzaButton
                  key={p.id}
                  pietanza={p}
                  isSending={sending === p.id}
                  feedbackOk={feedback?.id === p.id ? feedback.ok : null}
                  onClick={() => chiamaCucina(p)}
                />
              ))}
            </div>
          </section>
        )}

        {esterne.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-red-400 mb-4">🔥 Cucina Esterna</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {esterne.map(p => (
                <PietanzaButton
                  key={p.id}
                  pietanza={p}
                  isSending={sending === p.id}
                  feedbackOk={feedback?.id === p.id ? feedback.ok : null}
                  onClick={() => chiamaCucina(p)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PietanzaButton({
  pietanza,
  isSending,
  feedbackOk,
  onClick,
}: {
  pietanza: Pietanza
  isSending: boolean
  feedbackOk: boolean | null
  onClick: () => void
}) {
  const baseColor = pietanza.cucina === 'interna'
    ? 'bg-orange-600 hover:bg-orange-500'
    : 'bg-red-700 hover:bg-red-600'

  const stateColor =
    feedbackOk === true
      ? 'bg-green-600'
      : feedbackOk === false
      ? 'bg-red-900'
      : isSending
      ? 'bg-gray-600'
      : baseColor

  return (
    <button
      onClick={onClick}
      disabled={isSending}
      className={`
        ${stateColor}
        text-white font-bold rounded-2xl p-6 flex flex-col items-center justify-center gap-3
        text-2xl transition-all active:scale-95 disabled:cursor-not-allowed
        min-h-[120px] shadow-lg
      `}
    >
      <span className="text-center leading-tight">{pietanza.nome}</span>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
        pietanza.cucina === 'interna' ? 'bg-orange-800' : 'bg-red-900'
      }`}>
        {pietanza.cucina.toUpperCase()}
      </span>
      {feedbackOk === true && <span className="text-green-200 text-lg">✓ Inviato!</span>}
      {feedbackOk === false && <span className="text-red-200 text-lg">✗ Errore</span>}
      {isSending && <span className="text-gray-200 text-lg">...</span>}
    </button>
  )
}
