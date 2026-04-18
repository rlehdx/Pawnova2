import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await db.storage
      .from('product-images')
      .upload(filename, file, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = db.storage
      .from('product-images')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
