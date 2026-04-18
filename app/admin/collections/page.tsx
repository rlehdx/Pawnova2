'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'

interface Collection {
  id: string
  handle: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Collection>>({})
  const [newForm, setNewForm] = useState({ handle: '', title: '', description: '' })
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCollections() }, [])

  async function fetchCollections() {
    const res = await fetch('/api/admin/collections')
    const json = await res.json() as { collections: Collection[] }
    setCollections(json.collections ?? [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!newForm.handle || !newForm.title) return
    setSaving(true)
    await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    setNewForm({ handle: '', title: '', description: '' })
    setShowNew(false)
    setSaving(false)
    fetchCollections()
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    await fetch('/api/admin/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editData }),
    })
    setEditingId(null)
    setSaving(false)
    fetchCollections()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return
    await fetch('/api/admin/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchCollections()
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
          <Plus className="h-4 w-4" /> Add Collection
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Handle</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {showNew && (
              <tr className="bg-blue-50">
                <td className="px-4 py-3">
                  <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Title" className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                </td>
                <td className="px-4 py-3">
                  <input value={newForm.handle} onChange={e => setNewForm(p => ({ ...p, handle: e.target.value }))}
                    placeholder="handle" className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                </td>
                <td className="px-4 py-3 text-gray-400">—</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={handleCreate} disabled={saving} className="text-green-600 hover:text-green-700">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setShowNew(false)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )}
            {collections.map(col => (
              <tr key={col.id}>
                <td className="px-4 py-3">
                  {editingId === col.id ? (
                    <input value={editData.title ?? col.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                  ) : (
                    <span className="font-medium text-gray-900">{col.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{col.handle}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {col.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editingId === col.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(col.id)} className="text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-400"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(col.id); setEditData({ title: col.title }) }} className="text-blue-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(col.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
