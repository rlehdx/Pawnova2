import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Payment Cancelled
        </h1>
        <p className="text-gray-500 mb-8">
          Your order was not placed. Your cart has been saved.
        </p>
        <Link href="/cart" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700">
          Back to Cart
        </Link>
      </div>
    </div>
  )
}
