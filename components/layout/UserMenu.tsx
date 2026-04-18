'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { User, LogOut, Heart, Package, MapPin, ChevronDown } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (user ? setOpen((o) => !o) : handleSignIn())}
        aria-label="Account"
        className="flex items-center gap-1 p-2 rounded-[var(--radius-btn)] hover:bg-[var(--color-surface)] transition-colors"
      >
        <User className="h-5 w-5 text-[var(--color-text-muted)]" />
        {user && <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />}
      </button>

      {open && user && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-[var(--radius-card)] border shadow-lg z-50 py-1"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-divider)',
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-divider)' }}>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
              {user.email}
            </p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <Package className="h-4 w-4" />
            My Orders
          </Link>
          <Link
            href="/account#wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
          <Link
            href="/account#addresses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            <MapPin className="h-4 w-4" />
            Addresses
          </Link>
          <div className="border-t mt-1" style={{ borderColor: 'var(--color-divider)' }}>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
