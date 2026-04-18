import { createAdminClient } from '@/lib/supabase/admin-client'

async function getSubscribers() {
  const db = createAdminClient()
  const { data, count } = await db
    .from('pawnova_newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  return { subscribers: data ?? [], count: count ?? 0 }
}

export default async function AdminSubscribersPage() {
  const { subscribers, count } = await getSubscribers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
        <span className="text-sm text-gray-500">{count} total</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Subscribed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscribers.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">No subscribers yet</td></tr>
            )}
            {subscribers.map(sub => (
              <tr key={sub.id}>
                <td className="px-4 py-3 text-gray-900">{sub.email}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
