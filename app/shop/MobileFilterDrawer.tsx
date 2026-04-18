'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { FilterBar } from '@/components/shop/FilterBar'

export function MobileFilterDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex md:hidden items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold min-h-[44px] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-muted)' }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto p-6 shadow-xl"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Filters</h2>
                <button onClick={() => setOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterBar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
