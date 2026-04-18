import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const MAX_ADDRESSES = 3

function makeClient() {
  const cookieStore = cookies() as unknown as Awaited<ReturnType<typeof cookies>>
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )
}

export async function GET() {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('pawnova_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ addresses: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('pawnova_addresses')
    .select('id')
    .eq('user_id', user.id)

  if ((existing ?? []).length >= MAX_ADDRESSES) {
    return NextResponse.json({ error: `Maximum ${MAX_ADDRESSES} addresses allowed` }, { status: 400 })
  }

  const body = await request.json() as {
    label?: string; full_name: string; line1: string; line2?: string
    city: string; state?: string; postal_code: string; country?: string; is_default?: boolean
  }

  if (body.is_default) {
    await supabase.from('pawnova_addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('pawnova_addresses')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ address: data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { id: string; [key: string]: unknown }
  const { id, ...updates } = body

  if (updates.is_default) {
    await supabase.from('pawnova_addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('pawnova_addresses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ address: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json() as { id: string }
  await supabase.from('pawnova_addresses').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ deleted: true })
}
