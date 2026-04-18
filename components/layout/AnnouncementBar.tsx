'use client'

import { X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export function AnnouncementBar() {
  const { isAnnouncementDismissed, dismissAnnouncement } = useUIStore()

  if (isAnnouncementDismissed) return null

  return (
    <div
      className="relative flex items-center justify-center px-8 py-2 text-sm font-medium"
      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
    >
      <span>
        Free US Shipping $50+ · Arrives in 3–5 Days · 30-Day Returns
      </span>
      <button
        onClick={dismissAnnouncement}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-60 transition-opacity"
        aria-label="Dismiss announcement"
        style={{ color: 'var(--color-accent-text)' }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
