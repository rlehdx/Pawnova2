import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ThemeScript } from './ThemeScript'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PawNova — Premium Pet Wellness Accessories',
    template: '%s | PawNova',
  },
  description:
    'Science-backed toys and wellness gear for cats and dogs. Free US shipping on orders $50+. 30-day returns.',
  keywords: ['pet supplies', 'dog accessories', 'cat accessories', 'pet wellness', 'pet toys'],
  authors: [{ name: 'PawNova' }],
  creator: 'PawNova',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pawnova.com',
    siteName: 'PawNova',
    title: 'PawNova — Premium Pet Wellness Accessories',
    description:
      'Science-backed toys and wellness gear for cats and dogs. Free US shipping on orders $50+.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawNova — Premium Pet Wellness Accessories',
    description: 'Science-backed toys and wellness gear for cats and dogs.',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pawnova.com'),
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const theme = (cookieStore.get('theme')?.value ?? 'dark') as 'light' | 'dark'

  return (
    <html lang="en" data-theme={theme} className={dmSans.variable}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AnnouncementBar />
        <Header />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
