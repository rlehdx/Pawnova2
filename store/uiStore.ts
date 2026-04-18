'use client'

import { create } from 'zustand'

interface UIStore {
  // Cart drawer
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Mobile nav
  isMobileNavOpen: boolean
  openMobileNav: () => void
  closeMobileNav: () => void

  // Filter drawer (mobile)
  isFilterOpen: boolean
  openFilter: () => void
  closeFilter: () => void

  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Announcement bar
  isAnnouncementDismissed: boolean
  dismissAnnouncement: () => void

  // Recently viewed product handles
  recentlyViewed: string[]
  addRecentlyViewed: (handle: string) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

  isMobileNavOpen: false,
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  isFilterOpen: false,
  openFilter: () => set({ isFilterOpen: true }),
  closeFilter: () => set({ isFilterOpen: false }),

  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: next })
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
    }
    // Store in cookie
    if (typeof document !== 'undefined') {
      document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    }
  },

  isAnnouncementDismissed: false,
  dismissAnnouncement: () => {
    set({ isAnnouncementDismissed: true })
    if (typeof document !== 'undefined') {
      document.cookie = `announcement-dismissed=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    }
  },

  recentlyViewed: [],
  addRecentlyViewed: (handle) =>
    set((s) => ({
      recentlyViewed: [handle, ...s.recentlyViewed.filter((h) => h !== handle)].slice(0, 8),
    })),
}))
