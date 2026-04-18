'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ProductImage } from '@/types/database'

interface ProductImageGalleryProps {
  images: ProductImage[]
  title: string
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const activeImage = images[activeIndex]

  if (!activeImage) {
    return (
      <div className="aspect-square rounded-[var(--radius-card)] bg-[var(--color-surface)] flex items-center justify-center">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No image</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] cursor-zoom-in bg-[var(--color-surface)]"
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius-card)] border-2 transition-colors ${
                  i === activeIndex
                    ? 'border-[var(--color-accent)]'
                    : 'border-[var(--color-divider)] hover:border-[var(--color-text-muted)]'
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:opacity-75 transition-opacity"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[90vh] max-w-3xl w-full aspect-square"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? title}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
