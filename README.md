# Alert Sagra

Sistema di notifiche real-time per la gestione di una sagra paesana.
La distribuzione chiama le cucine quando manca una pietanza: le cucine ricevono un alert visivo e sonoro.

## Pagine

| URL | Ruolo |
|-----|-------|
| `/` | Home con link a tutte le sezioni |
| `/distribuzione` | Pannello di chiamata per la distribuzione |
| `/admin` | CRUD pietanze (protetto da password) |
| `/cucina/interna` | Schermo cucina interna |
| `/cucina/esterna` | Schermo cucina esterna |

---

## Schema SQL Supabase

Esegui questo script nell'**SQL Editor** del tuo progetto Supabase (`alert-sagra`):

```sql
-- Enum per cucina
CREATE TYPE cucina_type AS ENUM ('interna', 'esterna');
CREATE TYPE stato_chiamata AS ENUM ('pending', 'acknowledged');

-- Tabella pietanze
CREATE TABLE pietanze (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome       TEXT NOT NULL,
  cucina     cucina_type NOT NULL,
  attiva     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella chiamate
CREATE TABLE chiamate (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pietanza_id    BIGINT REFERENCES pietanze(id) ON DELETE SET NULL,
  pietanza_nome  TEXT NOT NULL,
  cucina_target  cucina_type NOT NULL,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now(),
  stato          stato_chiamata NOT NULL DEFAULT 'pending'
);

-- Indici utili
CREATE INDEX idx_chiamate_cucina ON chiamate(cucina_target);
CREATE INDEX idx_chiamate_timestamp ON chiamate(timestamp DESC);

-- Abilita Row Level Security
ALTER TABLE pietanze ENABLE ROW LEVEL SECURITY;
ALTER TABLE chiamate ENABLE ROW LEVEL SECURITY;

-- Policy: permetti tutto con anon key (adatto per uso locale/sagra)
CREATE POLICY "allow_all_pietanze" ON pietanze FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_chiamate" ON chiamate FOR ALL USING (true) WITH CHECK (true);
```

### Attiva Supabase Realtime

Nel pannello Supabase:
1. Vai su **Database → Replication**
2. Nella sezione **Supabase Realtime**, abilita la tabella `chiamate`
3. Seleziona almeno l'evento `INSERT`

---

## Setup locale

```bash
# 1. Installa dipendenze
npm install

# 2. Crea il file di configurazione
cp .env.example .env.local
# Modifica .env.local con i tuoi valori Supabase e la password admin

# 3. Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## Variabili d'ambiente

| Variabile | Descrizione |
|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase (es. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anonima Supabase |
| `ADMIN_PASSWORD` | Password per accedere a `/admin` |

---

## Deploy su Vercel

### 1. Crea repository GitHub

```bash
git init
git add .
git commit -m "feat: alert-sagra initial commit"
git remote add origin https://github.com/TUO_USERNAME/alert-sagra.git
git push -u origin main
```

### 2. Importa su Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New Project**
2. Importa il repository `alert-sagra` da GitHub
3. Nella sezione **Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. Clicca **Deploy**

---

## Utilizzo in sagra

1. **Setup una tantum**: esegui lo schema SQL su Supabase, aggiungi le pietanze da `/admin`
2. **Distribuzione**: apri `/distribuzione` su tablet o PC alla distribuzione
3. **Cucine**: apri `/cucina/interna` e `/cucina/esterna` sui PC a parete
4. **Attivazione audio**: ogni schermo cucina richiede un click iniziale (vincolo browser)

### Flusso di una chiamata

```
Distribuzione clicca "Lasagne"
    → POST /api/chiamate
        → Supabase INSERT su tabella chiamate
            → Realtime notifica /cucina/interna
                → Alert rosso a schermo intero + 3 beep
                → Repeat beep a 10s
                → Auto-chiusura a 30s (o click "RICEVUTO")
```
