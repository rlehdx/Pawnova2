import Link from 'next/link'
import { Instagram, Music2, Facebook } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--color-divider)] mt-16" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <ellipse cx="9" cy="8" rx="3.5" ry="4.5" fill="var(--color-accent)" />
                <ellipse cx="23" cy="8" rx="3.5" ry="4.5" fill="var(--color-accent)" />
                <ellipse cx="5" cy="16" rx="3" ry="4" fill="var(--color-accent)" />
                <ellipse cx="27" cy="16" rx="3" ry="4" fill="var(--color-accent)" />
                <path d="M16 12C10.477 12 7 16.5 7 20.5C7 24.642 11 27 16 27C21 27 25 24.642 25 20.5C25 16.5 21.523 12 16 12Z" fill="var(--color-accent)" />
              </svg>
              <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>PawNova</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Premium wellness accessories for cats and dogs. Backed by science, loved by pets.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                <Music2 className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Shop</h3>
            <ul className="space-y-2">
              {[
                { href: '/shop', label: 'All Products' },
                { href: '/collections/dogs', label: 'Dogs' },
                { href: '/collections/cats', label: 'Cats' },
                { href: '/collections/new-arrivals', label: 'New Arrivals' },
                { href: '/collections/sale', label: 'Sale' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Help */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Help</h3>
            <ul className="space-y-2">
              {[
                { href: '/faq', label: 'FAQ' },
                { href: '/shipping', label: 'Shipping Info' },
                { href: '/returns', label: 'Returns' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust / Payments */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Secure Checkout</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>We accept:</p>
            <div className="flex flex-wrap gap-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {['Visa', 'Mastercard', 'PayPal', 'Apple Pay', 'Shop Pay'].map((p) => (
                <span
                  key={p}
                  className="border border-[var(--color-divider)] rounded px-2 py-1"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-divider)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <p>© {year} PawNova · All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--color-accent)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-accent)] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
