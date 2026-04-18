import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

export async function GET() {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { data, error } = await db
      .from('pawnova_collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return NextResponse.json({ collections: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json()
    const { data, error } = await db.from('pawnova_collections').insert(body).select().single()
    if (error) throw error
    return NextResponse.json({ collection: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json() as { id: string } & Record<string, unknown>
    const { id, ...updates } = body
    const { error } = await db.from('pawnova_collections').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { id } = await request.json() as { id: string }
    const { error } = await db.from('pawnova_collections').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
