'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (data.success) {
        setStatus('success')
        setMessage("🎉 You're in! Check your inbox for 15% off.")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm font-medium py-3" style={{ color: 'var(--color-accent)' }}>
        {message}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-divider)',
            color: 'var(--color-text)',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
          }}
        >
          {status === 'loading' ? 'Loading...' : 'Get 15% Off'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-left" style={{ color: 'var(--color-badge-sale)' }}>
          {message}
        </p>
      )}
    </div>
  )
}
