'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search, Sun, Moon, Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { CartButton } from '@/components/cart/CartButton'
import { UserMenu } from '@/components/layout/UserMenu'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/collections/dogs', label: 'Dogs' },
  { href: '/collections/cats', label: 'Cats' },
  { href: '/collections/new-arrivals', label: 'New Arrivals' },
  { href: '/collections/sale', label: 'Sale' },
]

function PawNovLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-black tracking-wider text-xl" style={{ fontFamily: 'var(--font-display)' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="9" cy="8" rx="3.5" ry="4.5" fill="var(--color-accent)" />
        <ellipse cx="23" cy="8" rx="3.5" ry="4.5" fill="var(--color-accent)" />
        <ellipse cx="5" cy="16" rx="3" ry="4" fill="var(--color-accent)" />
        <ellipse cx="27" cy="16" rx="3" ry="4" fill="var(--color-accent)" />
        <path d="M16 12C10.477 12 7 16.5 7 20.5C7 24.642 11 27 16 27C21 27 25 24.642 25 20.5C25 16.5 21.523 12 16 12Z" fill="var(--color-accent)" />
      </svg>
      <span style={{ color: 'var(--color-text)' }}>PawNova</span>
    </Link>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme, isMobileNavOpen, openMobileNav, closeMobileNav } = useUIStore()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div className="sticky top-0 z-40 w-full px-4 md:px-8 pt-3">
        <header
          className={cn(
            'mx-auto max-w-7xl rounded-full border transition-all duration-300',
            scrolled
              ? 'border-[var(--color-accent)]/20 shadow-lg shadow-black/40 backdrop-blur-md'
              : 'border-[var(--color-divider)]'
          )}
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, transparent)' }}
        >
          <div className="flex items-center justify-between px-5 py-2.5">
            <PawNovLogo />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              <Link
                href="/shop"
                aria-label="Search"
                className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Search className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              </Link>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                ) : (
                  <Sun className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                )}
              </button>
              <UserMenu />
              <CartButton />
              <button
                onClick={openMobileNav}
                aria-label="Open menu"
                className="md:hidden p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Menu className="h-4 w-4" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile nav — right-slide drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileNav}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 flex flex-col p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between mb-8">
              <PawNovLogo />
              <button
                onClick={closeMobileNav}
                aria-label="Close menu"
                className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileNav}
                  className="text-base font-medium py-3 px-4 rounded-xl transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
                  style={{ color: 'var(--color-text)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
