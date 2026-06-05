import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cucina = searchParams.get('cucina')
  const supabase = getSupabase()

  let query = supabase
    .from('chiamate')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50)

  if (cucina) {
    query = query.eq('cucina_target', cucina)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('chiamate')
    .insert({
      pietanza_id: body.pietanza_id,
      pietanza_nome: body.pietanza_nome,
      cucina_target: body.cucina_target,
      stato: 'pending',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
