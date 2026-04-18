'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItem {
  title: string
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className={cn('divide-y divide-[var(--color-divider)]', className)}>
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
            aria-expanded={openIndex === i}
          >
            {item.title}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200',
                openIndex === i && 'rotate-180'
              )}
            />
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === i ? 'max-h-96 pb-4' : 'max-h-0'
            )}
          >
            <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
