import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Order Confirmed!
        </h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
        </p>
        <Link href="/shop" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
