'use client'

import { useEffect, useState } from 'react'
import type { Pietanza, Cucina } from '@/lib/supabase'

type FormState = { nome: string; cucina: Cucina; attiva: boolean }

function FormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  label,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  label: string
}) {
  return (
    <form onSubmit={onSubmit} className="bg-gray-700 p-6 rounded-xl flex flex-col gap-4 mt-4">
      <input
        required
        type="text"
        placeholder="Nome pietanza"
        value={form.nome}
        onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
        className="bg-gray-600 text-white text-xl p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <select
        value={form.cucina}
        onChange={e => setForm(f => ({ ...f, cucina: e.target.value as Cucina }))}
        className="bg-gray-600 text-white text-xl p-3 rounded-lg outline-none"
      >
        <option value="interna">🍳 Cucina Interna</option>
        <option value="esterna">🔥 Cucina Esterna</option>
      </select>
      <label className="flex items-center gap-3 text-white text-xl cursor-pointer">
        <input
          type="checkbox"
          checked={form.attiva}
          onChange={e => setForm(f => ({ ...f, attiva: e.target.checked }))}
          className="w-5 h-5"
        />
        Attiva
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xl font-bold py-3 rounded-xl transition-colors"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold py-3 rounded-xl transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [pietanze, setPietanze] = useState<Pietanza[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>({ nome: '', cucina: 'interna', attiva: true })
  const [showAdd, setShowAdd] = useState(false)
  const [msg, setMsg] = useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Password errata')
    }
  }

  async function fetchPietanze() {
    setLoading(true)
    const res = await fetch('/api/pietanze')
    const data = await res.json()
    setPietanze(data)
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchPietanze()
  }, [authed])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/pietanze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ nome: '', cucina: 'interna', attiva: true })
      setShowAdd(false)
      flashMsg('Pietanza aggiunta')
      fetchPietanze()
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/pietanze/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setEditingId(null)
      flashMsg('Pietanza aggiornata')
      fetchPietanze()
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Eliminare "${nome}"?`)) return
    const res = await fetch(`/api/pietanze/${id}`, { method: 'DELETE' })
    if (res.ok) {
      flashMsg('Pietanza eliminata')
      fetchPietanze()
    }
  }

  function startEdit(p: Pietanza) {
    setEditingId(p.id)
    setForm({ nome: p.nome, cucina: p.cucina, attiva: p.attiva })
    setShowAdd(false)
  }

  function flashMsg(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={login} className="bg-gray-800 p-8 rounded-2xl flex flex-col gap-4 w-full max-w-sm">
          <h1 className="text-3xl font-bold text-white text-center">⚙️ Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-700 text-white text-xl p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {authError && <p className="text-red-400 text-center">{authError}</p>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-4 rounded-xl transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    )
  }

  function cancelForm() {
    setShowAdd(false)
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">⚙️ Gestione Pietanze</h1>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm({ nome: '', cucina: 'interna', attiva: true }) }}
            className="bg-green-600 hover:bg-green-500 text-white text-xl font-bold px-6 py-3 rounded-xl transition-colors"
          >
            + Aggiungi
          </button>
        </div>

        {msg && (
          <div className="bg-green-700 text-white text-xl p-4 rounded-xl mb-4 text-center">{msg}</div>
        )}

        {showAdd && !editingId && (
          <FormFields form={form} setForm={setForm} onSubmit={handleAdd} onCancel={cancelForm} label="Aggiungi" />
        )}

        {loading && <p className="text-gray-400 text-xl text-center py-8">Caricamento...</p>}

        <div className="flex flex-col gap-3 mt-4">
          {pietanze.map(p => (
            <div key={p.id} className="bg-gray-800 rounded-xl p-5">
              {editingId === p.id ? (
                <FormFields form={form} setForm={setForm} onSubmit={handleEdit} onCancel={cancelForm} label="Salva" />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`shrink-0 px-3 py-1 rounded-lg text-sm font-bold text-white ${p.cucina === 'interna' ? 'bg-orange-600' : 'bg-red-700'}`}>
                      {p.cucina.toUpperCase()}
                    </span>
                    <span className="text-white text-2xl font-semibold truncate">{p.nome}</span>
                    {!p.attiva && (
                      <span className="shrink-0 px-2 py-1 bg-gray-600 rounded text-gray-300 text-sm">inattiva</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-lg font-bold transition-colors"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.nome)}
                      className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-lg font-bold transition-colors"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && pietanze.length === 0 && (
          <p className="text-gray-500 text-xl text-center py-12">Nessuna pietanza. Aggiungine una!</p>
        )}
      </div>
    </div>
  )
}
