'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Upload } from 'lucide-react'

interface VariantInput {
  id?: string
  title: string
  price: string
  compare_at_price: string
  sku: string
  inventory_quantity: string
  option1_name: string
  option1_value: string
}

interface ImageInput {
  url: string
  alt_text: string
  isUploading?: boolean
}

interface Collection {
  id: string
  title: string
}

interface ProductFormProps {
  mode: 'new' | 'edit'
  productId?: string
  collections: Collection[]
  initialData?: {
    title: string
    handle: string
    description: string
    description_html: string
    tags: string
    is_active: boolean
    seo_title: string
    seo_description: string
    images: ImageInput[]
    variants: VariantInput[]
    collection_ids: string[]
  }
}

const defaultVariant: VariantInput = {
  title: 'Default',
  price: '',
  compare_at_price: '',
  sku: '',
  inventory_quantity: '0',
  option1_name: '',
  option1_value: '',
}

export function ProductForm({ mode, productId, collections, initialData }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [handle, setHandle] = useState(initialData?.handle ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [tags, setTags] = useState(initialData?.tags ?? '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? '')
  const [images, setImages] = useState<ImageInput[]>(initialData?.images ?? [])
  const [variants, setVariants] = useState<VariantInput[]>(initialData?.variants ?? [{ ...defaultVariant }])
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialData?.collection_ids ?? [])

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json() as { url?: string; error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Upload failed')
    return json.url!
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    const startIdx = images.length
    const placeholders: ImageInput[] = Array.from(files).map(() => ({ url: '', alt_text: '', isUploading: true }))
    setImages(prev => [...prev, ...placeholders])
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i])
        setImages(prev => {
          const next = [...prev]
          next[startIdx + i] = { url, alt_text: files[i].name, isUploading: false }
          return next
        })
      } catch {
        setImages(prev => prev.filter((_, idx) => idx !== startIdx + i))
      }
    }
  }

  async function handleSave() {
    if (!title || !handle || variants.some(v => !v.price)) {
      setError('Title, handle, and variant prices are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title,
        handle,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_active: isActive,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        images: images.filter(img => img.url).map((img, i) => ({ url: img.url, alt_text: img.alt_text || null, sort_order: i })),
        variants: variants.map((v, i) => ({
          title: v.title || 'Default',
          price: parseFloat(v.price),
          compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
          sku: v.sku || null,
          inventory_quantity: parseInt(v.inventory_quantity) || 0,
          option1_name: v.option1_name || null,
          option1_value: v.option1_value || null,
          sort_order: i,
        })),
        collection_ids: selectedCollections,
      }

      const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${productId}`
      const method = mode === 'new' ? 'POST' : 'PUT'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!productId || !confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  function toggleCollection(id: string) {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Handle (URL slug) *</label>
            <input value={handle} onChange={e => setHandle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
          <span className="text-gray-700">Active (visible in store)</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              {img.isUploading ? (
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                </div>
              ) : img.url ? (
                <img src={img.url} alt={img.alt_text} className="h-20 w-20 object-cover rounded-lg" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <input value={img.url} onChange={e => setImages(prev => { const n = [...prev]; n[i] = { ...n[i], url: e.target.value }; return n })}
                    placeholder="https://..." className="w-full text-xs border-0 bg-transparent text-center focus:outline-none" />
                </div>
              )}
              <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 text-xs">
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button onClick={() => setImages(prev => [...prev, { url: '', alt_text: '' }])}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 text-xs">
              <Plus className="h-4 w-4" />
              URL
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Variants</h2>
          <button onClick={() => setVariants(prev => [...prev, { ...defaultVariant }])}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" /> Add Variant
          </button>
        </div>
        {variants.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Variant {i + 1}</span>
              {variants.length > 1 && (
                <button onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input value={v.title} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], title: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price *</label>
                <input type="number" step="0.01" value={v.price} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], price: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Compare At Price</label>
                <input type="number" step="0.01" value={v.compare_at_price} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], compare_at_price: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SKU</label>
                <input value={v.sku} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], sku: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Inventory</label>
                <input type="number" value={v.inventory_quantity} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], inventory_quantity: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Collections</h2>
        <div className="flex flex-wrap gap-2">
          {collections.map(col => (
            <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100">
              <input type="checkbox" checked={selectedCollections.includes(col.id)} onChange={() => toggleCollection(col.id)} className="rounded" />
              {col.title}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">SEO</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
          <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
          <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'new' ? 'Create Product' : 'Save Changes'}
        </button>
        {mode === 'edit' && (
          <button onClick={handleDelete} disabled={deleting}
            className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        )}
      </div>
    </div>
  )
}
