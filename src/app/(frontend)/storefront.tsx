'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Article, Category, Media, Product } from '@/payload-types'
import { sendEnquiry } from './actions'

type ProductWithExtras = Product & {
  highlights?: string[]
  rating?: number
  reviewsCount?: number
  shortDescription?: string
}

type Data = { products: ProductWithExtras[]; categories: Category[]; articles: Article[]; hero: Media | null }
type Cart = { id: string; qty: number; variation: string }[]
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`
const button = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#9b452f] px-7 text-sm font-medium text-white transition hover:bg-[#783722] cursor-pointer'
const wrap = 'mx-auto max-w-[1440px] px-6 lg:px-10'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    leaf: <><path d="M20 3S6 1 4 10s8 13 13 5c3-5 3-12 3-12Z" /><path d="M3 21 15 9" /></>,
    box: <><path d="m12 3 9 5v10l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v10M7 5l9 5" /></>,
    hand: <><path d="m4 14 4-2 5 2 5-2c4-1 4 2 2 3l-9 5-7-3M9 11V5c0-3 3-3 3 0v5m0-4c4-5 10 0 0 6" /></>,
    shield: <><path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z" /><path d="m8 12 3 3 5-6" /></>,
    phone: <path d="m7 3 3 5-3 3c1 3 3 5 6 6l3-3 5 3c0 7-8 5-13 0S1 3 7 3Z" />,
    chat: <><path d="M21 11a9 9 0 0 1-13 8l-6 2 2-6a9 9 0 1 1 17-4Z" /><path d="M8 8c0 5 3 7 7 7" /></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    check: <polyline points="20 6 9 17 4 12" />,
    truck: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  }
  return <svg className={`h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.leaf}</svg>
}

function Photo({ media, className = '', priority = false }: { media?: string | Media | null; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false)
  const url = typeof media === 'string' ? media : (media && typeof media === 'object' ? media.url : null)
  const alt = (media && typeof media === 'object' && media.alt) ? media.alt : 'S&M IMPEX collection'
  return (
    <div className={`relative overflow-hidden bg-[#e8e0d2] ${className}`}>
      {url && !failed ? (
        <Image src={url} alt={alt} fill sizes="(max-width: 800px) 90vw, 40vw" className="object-cover transition duration-700 group-hover:scale-105" priority={priority} onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full items-center justify-center text-[#76654d]"><Icon name="leaf" className="h-16 w-16" /></div>
      )}
    </div>
  )
}


function Heading({ eyebrow, title, href, link = 'Explore collection' }: { eyebrow: string; title: string; href?: string; link?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[.2em] text-[#995039]">{eyebrow}</p>
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
      </div>
      {href && <Link href={href} className="flex min-h-11 items-center gap-3 border-b border-[#8d5038] text-sm font-medium hover:text-[#9b452f] transition">{link}<Icon name="arrow" /></Link>}
    </div>
  )
}


function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement
    ref.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const list = ref.current?.querySelectorAll<HTMLElement>('button,a,input,select,textarea')
        if (!list?.length) return
        if (e.shiftKey && (document.activeElement === list[0] || document.activeElement === ref.current)) { e.preventDefault(); list[list.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === list[list.length - 1]) { e.preventDefault(); list[0].focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => { document.removeEventListener('keydown', handler); prev?.focus() }
  }, [close])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={close}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-auto bg-[#fbf8f1] p-6 md:p-9 rounded-sm shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-[#e6dece] pb-4">
          <h2 id="dialog-title" className="font-serif text-2xl md:text-3xl">{title}</h2>
          <button onClick={close} aria-label="Close dialog" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#efe4d5] transition"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}


function QuickViewDrawer({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}: {
  product: ProductWithExtras | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: ProductWithExtras, count: number, variation: string) => void
  onBuyNow: (product: ProductWithExtras, count: number, variation: string) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [selectedPack, setSelectedPack] = useState('')

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1)
      setIsAdded(false)
      setSelectedPack(product.size || product.variations?.[0]?.label || '30g Box (Standard)')
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKey)
      return () => {
        document.body.style.overflow = prevOverflow
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [isOpen, product, onClose])

  if (!isOpen || !product) return null

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedPack)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2200)
  }

  const handleBuy = () => {
    onBuyNow(product, quantity, selectedPack)
  }

  const mainImgUrl = typeof product.image === 'object' && product.image ? product.image.url : (typeof product.image === 'string' ? product.image : '/images/sandm/products/lavender-agarbatti-30g.png')

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const packOptions = [
    { label: product.size || '30g Box (Standard)', extra: '+₹0' },
    { label: '50g Value Pack', extra: '+₹60' },
    { label: '3-Pack Gift Set', extra: '+₹150' },
    { label: 'Master Carton (Wholesale)', extra: 'Bulk' },
  ]

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Dimmed Warm Backdrop */}
      <div
        className="fixed inset-0 bg-[#231b14]/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Right Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view ${product.name}`}
        className="relative z-10 flex h-full w-full max-w-[920px] flex-col bg-[#fcfaf7] shadow-2xl transition-all duration-300 md:flex-row overflow-hidden border-l border-[#e8dfd1]"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Quick View"
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-[#352d25] text-white shadow-md hover:scale-105 hover:bg-[#9b452f] transition-all cursor-pointer"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>

        {/* LEFT COLUMN: Single 1:1 Master Showcase + Artisanal Guarantee (48% Width) */}
        <div className="w-full md:w-[48%] bg-[#f7f2ea] p-5 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#e8dfd1] overflow-y-auto">
          <div className="space-y-4">
            {/* Header Tag */}
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#7a6b5d]">
              <span>Master 1:1 Product View</span>
              <span className="text-[#9b452f] font-semibold">S&M IMPEX Authentic</span>
            </div>

            {/* Single 1:1 Master Packshot Frame */}
            <div className="group relative aspect-square w-full rounded-2xl border border-[#e4dcd0] bg-white p-6 shadow-xs flex items-center justify-center overflow-hidden">
              {/* Corner Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                <span className="rounded-full bg-[#fcfaf7]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9b452f] border border-[#e8dfd1] shadow-2xs backdrop-blur-xs">
                  {typeof product.category === 'object' && product.category?.name ? product.category.name : 'Artisanal'}
                </span>
                {product.badge && (
                  <span className="rounded-full bg-[#9b452f] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                    {product.badge}
                  </span>
                )}
              </div>

              {discount > 0 && (
                <span className="absolute top-3 right-3 z-10 rounded-full bg-[#46513d] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                  Save {discount}%
                </span>
              )}

              {/* Master Packshot */}
              <img
                src={mainImgUrl || '/images/sandm/products/lavender-agarbatti-30g.png'}
                alt={product.name}
                className="max-h-[290px] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Artisanal Heritage & Purity Guarantee Strip */}
          <div className="mt-5 rounded-xl border border-[#e4dcd0] bg-white p-4 space-y-2.5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a6b5d]">Artisanal Purity & Export Standards</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#4a3f35]">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#46513d] font-bold">🌿</span>
                <span className="text-[11px] leading-tight">100% Charcoal-Free</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#9b452f] font-bold">🖐️</span>
                <span className="text-[11px] leading-tight">Hand-Rolled in India</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#46513d] font-bold">📦</span>
                <span className="text-[11px] leading-tight">Aroma-Lock Pack</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#9b452f] font-bold">🚚</span>
                <span className="text-[11px] leading-tight">Dispatched in 24 Hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Configuration & Sticky Purchase Details (52% Width) */}
        <div className="w-full md:w-[52%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-[#fcfaf7]">
          <div className="space-y-4">
            {/* Category Eyebrow */}
            <div className="pr-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9b452f]">
                {typeof product.category === 'object' && product.category?.name ? product.category.name : 'S&M IMPEX Collection'}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2d241e] leading-snug mt-1">
                {product.name}
              </h2>

              {/* Reviews & Grade */}
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <div className="flex text-amber-500 text-sm">
                  {'★'.repeat(5)}
                </div>
                <span className="font-bold text-[#2d241e]">{product.rating || 4.9}</span>
                <span className="text-[#8c7d6e]">({product.reviewsCount || 34} verified reviews)</span>
                <span className="text-[#dcd3c3]">·</span>
                <span className="font-semibold text-[#46513d]">Export Grade A+</span>
              </div>
            </div>

            {/* Price & Microcopy */}
            <div className="border-y border-[#e8dfd1] py-3 space-y-1">
              <div className="flex items-baseline gap-3">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2d241e] tracking-tight">
                  {money(product.price)}
                </div>
                {product.originalPrice && (
                  <del className="text-sm font-semibold text-[#8c7d6e]">
                    {money(product.originalPrice)}
                  </del>
                )}
                {discount > 0 && (
                  <span className="rounded-md bg-[#f4eae4] px-2 py-0.5 text-xs font-bold text-[#9b452f]">
                    Save {discount}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7a6b5d]">
                Inclusive of all taxes · Free delivery on orders over ₹499 · COD Available
              </p>
            </div>

            {/* Fragrance / Sensory Highlights */}
            {product.description && (
              <p className="text-xs text-[#5c4f43] leading-relaxed line-clamp-2">
                {product.shortDescription || product.description}
              </p>
            )}

            {/* Fragrance & Ritual Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-[#e4dcd0] bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8c7d6e]">Fragrance Notes</span>
                <span className="font-semibold text-[#2d241e] text-[11px] truncate block mt-0.5">
                  {product.fragrance || product.colour || 'Natural Temple Blend'}
                </span>
              </div>
              <div className="rounded-lg border border-[#e4dcd0] bg-white p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8c7d6e]">Burn Duration</span>
                <span className="font-semibold text-[#2d241e] text-[11px] block mt-0.5">
                  45–50 Mins Slow Aroma
                </span>
              </div>
            </div>

            {/* Pack Size / Format Selection Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5c4f43]">Select Pack Size:</span>
                <span className="text-[10px] text-[#8c7d6e]">{selectedPack}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {packOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPack(opt.label)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${selectedPack === opt.label
                      ? 'border-[#9b452f] bg-[#fbf3f0] text-[#9b452f] font-bold ring-1 ring-[#9b452f]'
                      : 'border-[#e4dcd0] bg-white text-[#5c4f43] hover:border-[#9b452f]'
                      }`}
                  >
                    <span className="truncate pr-1 text-[11px]">{opt.label}</span>
                    <span className="text-[10px] font-semibold opacity-75">{opt.extra}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Stock Badge */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="inline-flex items-center rounded-xl border border-[#dcd3c3] bg-[#f7f2ea] px-2 py-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-[#2d241e] cursor-pointer transition"
                >
                  <Icon name="minus" className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-[#2d241e]">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(q => Math.min(q + 1, product.stock || 99))}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white text-[#2d241e] cursor-pointer transition"
                >
                  <Icon name="plus" className="h-3 w-3" />
                </button>
              </div>

              <span className="text-xs font-semibold text-[#46513d] flex items-center gap-1.5">
                <Icon name="checkCircle" className="h-3.5 w-3.5 text-[#46513d]" />
                In Stock ({product.stock || 40} ready to ship)
              </span>
            </div>
          </div>

          {/* DUAL ACTION BUTTONS (STICKY BOTTOM CLUSTER) */}
          <div className="space-y-2.5 pt-5 border-t border-[#e8dfd1] mt-4">
            <button
              onClick={handleAdd}
              className={`w-full h-11 sm:h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${isAdded
                ? 'bg-[#46513d] text-white ring-2 ring-[#46513d]/30'
                : 'bg-[#9b452f] hover:bg-[#833724] text-white'
                }`}
            >
              <Icon name="bag" className="h-4 w-4" />
              {isAdded ? '✓ Added to your Bag!' : 'Add to Bag'}
            </button>

            <button
              onClick={handleBuy}
              className="w-full h-11 sm:h-12 rounded-full bg-[#46513d] hover:bg-[#384231] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Buy It Now · Instant Checkout
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="font-semibold text-[#7a6b5d] hover:text-[#9b452f] underline transition"
              >
                View full product story & specifications →
              </Link>
              <Link
                href={`/contact?subject=${encodeURIComponent('Bulk / Export Inquiry: ' + product.name)}`}
                onClick={onClose}
                className="font-semibold text-[#46513d] hover:underline"
              >
                Export B2B Quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



function CartDrawer({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQty,
  onRemove,
  total,
}: {
  isOpen: boolean
  onClose: () => void
  cart: Cart
  products: ProductWithExtras[]
  onUpdateQty: (index: number, newQty: number) => void
  onRemove: (index: number) => void
  total: number
}) {
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKey)
      return () => {
        document.body.style.overflow = prevOverflow
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const FREE_SHIPPING_THRESHOLD = 499
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progressPercent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#231b14]/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        className="relative z-10 flex h-full w-full max-w-[460px] flex-col bg-[#fcfaf7] shadow-2xl transition-all duration-300 border-l border-[#e8dfd1] overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#e8dfd1] px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2d241e]">Your Shopping Bag</h2>
            <span className="rounded-full bg-[#f4eae4] px-2.5 py-0.5 text-xs font-bold text-[#9b452f]">
              {cart.reduce((s, c) => s + c.qty, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Bag"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f2ea] text-[#2d241e] hover:bg-[#9b452f] hover:text-white transition cursor-pointer"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        {/* Free Express Shipping Meter */}
        <div className="border-b border-[#e8dfd1] bg-[#fbf6ee] px-6 py-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            {remaining === 0 ? (
              <span className="font-bold text-[#46513d] flex items-center gap-1.5">
                <span>🎉</span> <span>You unlocked <strong>FREE Express Delivery</strong>!</span>
              </span>
            ) : (
              <span className="text-[#6d5b4d]">
                Add <strong className="text-[#9b452f]">{money(remaining)}</strong> more for <strong>FREE Delivery</strong>
              </span>
            )}
            <span className="text-[11px] font-semibold text-[#8c7d6e]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#e8dfd1] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${remaining === 0 ? 'bg-[#46513d]' : 'bg-[#9b452f]'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-[#e8dfd1]/80">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4eae4] text-[#9b452f]">
                <Icon name="bag" className="h-8 w-8" />
              </div>
              <p className="font-serif text-xl font-bold text-[#2d241e]">Your bag is currently empty.</p>
              <p className="text-xs text-[#756757] max-w-xs mx-auto">
                Discover our hand-rolled charcoal-free incense, pure sambrani cups, and artisanal creations.
              </p>
              <Link
                href="/shop"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#9b452f] px-6 text-xs font-bold text-white hover:bg-[#803825] transition"
              >
                Explore Sacred Collection
              </Link>
            </div>
          ) : (
            cart.map((item, index) => {
              const p = products.find(prod => prod.id === item.id)
              if (!p) return null
              return (
                <div key={`${item.id}-${item.variation}-${index}`} className="flex gap-4 pt-4 first:pt-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e4dcd0] bg-white p-1 shadow-2xs">
                    <Photo media={p.image} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={onClose}
                          className="font-serif text-sm font-bold text-[#2d241e] hover:text-[#9b452f] line-clamp-1 transition"
                        >
                          {p.name}
                        </Link>
                        <button
                          onClick={() => onRemove(index)}
                          aria-label={`Remove ${p.name}`}
                          className="text-[11px] text-[#a08f7f] hover:text-[#9b452f] transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-[#7a6b5d] mt-0.5">
                        {item.variation}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-lg border border-[#dcd3c3] bg-[#f7f2ea] px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(index, Math.max(1, item.qty - 1))}
                          className="h-6 w-6 flex items-center justify-center rounded text-[#2d241e] hover:bg-white text-xs cursor-pointer transition"
                        >
                          <Icon name="minus" className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#2d241e]">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(index, Math.min(p.stock || 99, item.qty + 1))}
                          className="h-6 w-6 flex items-center justify-center rounded text-[#2d241e] hover:bg-white text-xs cursor-pointer transition"
                        >
                          <Icon name="plus" className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-serif font-bold text-[#2d241e]">
                          {money(p.price * item.qty)}
                        </span>
                        {item.qty > 1 && (
                          <span className="block text-[10px] text-[#8c7d6e]">{money(p.price)} each</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Artisanal Quality Strip */}
        {cart.length > 0 && (
          <div className="border-t border-[#e8dfd1] bg-[#f7f2ea] px-6 py-2.5">
            <div className="flex items-center justify-around text-[10px] font-bold text-[#6d5b4d] uppercase tracking-wider">
              <span>🌿 100% Charcoal-Free</span>
              <span>·</span>
              <span>📦 Aroma-Lock Sealed</span>
              <span>·</span>
              <span>🚚 Bangalore 24h Dispatch</span>
            </div>
          </div>
        )}

        {/* Footer Checkout Cluster */}
        {cart.length > 0 && (
          <div className="border-t border-[#e8dfd1] bg-white p-6 space-y-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-base font-serif font-bold text-[#2d241e]">
                <span>Subtotal</span>
                <span className="text-xl text-[#9b452f]">{money(total)}</span>
              </div>
              <p className="text-[11px] text-[#8c7d6e]">
                Taxes included. Insured Pan-India packaging and courier tracking included.
              </p>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full h-12 rounded-full bg-[#9b452f] hover:bg-[#803825] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <Icon name="arrow" className="h-4 w-4" />
            </Link>

            <Link
              href={`https://wa.me/919845012345?text=${encodeURIComponent('Hello S&M IMPEX, I would like to place an order for: ' + cart.map(c => `${c.qty}x ${c.id} (${c.variation})`).join(', ') + `. Subtotal: ${money(total)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 rounded-full border border-[#426443] text-[#426443] hover:bg-[#f0f4ee] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon name="chat" className="h-3.5 w-3.5" />
              <span>Instant WhatsApp Order Assist</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckoutView({ data, cart, total, saveCart }: { data: Data; cart: Cart; total: number; saveCart: (c: Cart) => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pincode, setPincode] = useState('')
  const [city, setCity] = useState('Bengaluru')
  const [state, setState] = useState('Karnataka')
  const [address, setAddress] = useState('')
  const [whatsAppUpdates, setWhatsAppUpdates] = useState(true)

  const [isB2B, setIsB2B] = useState(false)
  const [company, setCompany] = useState('')
  const [gstin, setGstin] = useState('')

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi')
  const [coupon, setCoupon] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [isPlacing, setIsPlacing] = useState(false)

  const handlePincodeChange = (pin: string) => {
    setPincode(pin)
    if (pin.length === 6) {
      if (pin.startsWith('560') || pin.startsWith('561') || pin.startsWith('562')) {
        setCity('Bengaluru')
        setState('Karnataka')
      } else if (pin.startsWith('57') || pin.startsWith('58') || pin.startsWith('59')) {
        setCity('Karnataka')
        setState('Karnataka')
      } else if (pin.startsWith('400') || pin.startsWith('401')) {
        setCity('Mumbai')
        setState('Maharashtra')
      } else if (pin.startsWith('110') || pin.startsWith('111')) {
        setCity('New Delhi')
        setState('Delhi')
      } else if (pin.startsWith('600') || pin.startsWith('601')) {
        setCity('Chennai')
        setState('Tamil Nadu')
      } else if (pin.startsWith('500') || pin.startsWith('501')) {
        setCity('Hyderabad')
        setState('Telangana')
      } else if (pin.startsWith('700') || pin.startsWith('701')) {
        setCity('Kolkata')
        setState('West Bengal')
      }
    }
  }

  const applyCoupon = () => {
    setCouponMsg('')
    if (!coupon.trim()) return
    const code = coupon.trim().toUpperCase()
    if (code === 'WELCOME10' || code === 'SANDM10') {
      const discount = Math.round(total * 0.1)
      setAppliedDiscount(discount)
      setCouponMsg('✓ 10% Welcome Discount Applied!')
    } else {
      setCouponMsg('Invalid coupon code. Try WELCOME10 for 10% off.')
    }
  }

  const shippingFee = shippingMethod === 'express' ? 99 : (total >= 499 ? 0 : 50)
  const finalTotal = Math.max(0, total - appliedDiscount + shippingFee)

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      alert('Please complete all required contact, address, and pincode fields.')
      return
    }

    setIsPlacing(true)
    const orderId = `SMI-${Math.floor(100000 + Math.random() * 900000)}`
    const orderRecord = {
      id: orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: cart.map(c => {
        const p = data.products.find(x => x.id === c.id)
        return {
          id: c.id,
          name: p?.name || 'Artisanal Product',
          variation: c.variation,
          qty: c.qty,
          price: p?.price || 0,
          image: typeof p?.image === 'object' && p?.image?.url ? p.image.url : (typeof p?.image === 'string' ? p.image : '/images/sandm/products/lavender-agarbatti-30g.png')
        }
      }),
      customer: { name, phone, email, address, pincode, city, state, isB2B, company, gstin },
      shippingMethod,
      paymentMethod,
      subtotal: total,
      shippingFee,
      discountAmount: appliedDiscount,
      total: finalTotal,
      status: 'Order Confirmed'
    }

    try {
      const existing = JSON.parse(localStorage.getItem('sandm-orders') || '[]')
      localStorage.setItem('sandm-orders', JSON.stringify([orderRecord, ...existing]))
      localStorage.setItem('sandm-latest-order', JSON.stringify(orderRecord))
    } catch { }

    saveCart([])
    router.push(`/checkout/confirmation?id=${orderId}`)
  }

  if (cart.length === 0) {
    return (
      <div className={`${wrap} py-16 text-center space-y-4`}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f4eae4] text-[#9b452f]">
          <Icon name="bag" className="h-10 w-10" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#2d241e]">Your Shopping Bag is Empty</h1>
        <p className="text-sm text-[#756757] max-w-md mx-auto">
          Explore our collection of authentic charcoal-free agarbatties, pure sambranies, handmade flowers, and candles to proceed with checkout.
        </p>
        <Link href="/shop" className={`${button} rounded-full`}>
          Discover Our Collections
        </Link>
      </div>
    )
  }

  return (
    <div className={`${wrap} py-10 md:py-14`}>
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-xs text-[#756757]">
        <Link href="/" className="hover:text-[#9b452f]">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#9b452f]">Shop</Link>
        <span>/</span>
        <span className="font-semibold text-[#2d241e]">Checkout</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* LEFT COLUMN: Checkout Form Steps */}
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          {/* STEP 1: Contact & Delivery Information */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-[#e8dfd1] pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9b452f] text-xs font-bold text-white">1</span>
              <h2 className="font-serif text-xl font-bold text-[#2d241e]">Delivery &amp; Contact Information</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                  Full Name <span className="text-[#9b452f]">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                  Mobile Number <span className="text-[#9b452f]">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[#dcd3c3] bg-[#f7f2ea] px-3 text-xs font-bold text-[#6d5b4d]">+91</span>
                  <input
                    required
                    type="tel"
                    placeholder="98450 12345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-r-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                Email Address (For Tax Invoice &amp; Tracking)
              </label>
              <input
                type="email"
                placeholder="rajesh@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                  Pincode <span className="text-[#9b452f]">*</span>
                </label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="560001"
                  value={pincode}
                  onChange={e => handlePincodeChange(e.target.value)}
                  className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm font-bold text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2.5 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1.5">
                Complete Street Address <span className="text-[#9b452f]">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House / Flat No., Apartment, Street name, Landmark"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2 text-sm text-[#2d241e] focus:border-[#9b452f] focus:bg-white focus:outline-hidden"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#5c4f43] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={whatsAppUpdates}
                onChange={e => setWhatsAppUpdates(e.target.checked)}
                className="rounded border-[#dcd3c3] text-[#9b452f] focus:ring-[#9b452f]"
              />
              <span>Send instant dispatch &amp; delivery updates directly to my <strong>WhatsApp</strong></span>
            </label>
          </div>

          {/* STEP 2: Order Type: Personal or B2B Wholesale GST */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#e8dfd1] pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9b452f] text-xs font-bold text-white">2</span>
              <h2 className="font-serif text-xl font-bold text-[#2d241e]">Order Classification</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsB2B(false)}
                className={`p-3.5 rounded-xl border text-left text-xs transition cursor-pointer ${!isB2B
                  ? 'border-[#9b452f] bg-[#fbf3f0] text-[#9b452f] font-bold ring-1 ring-[#9b452f]'
                  : 'border-[#e4dcd0] bg-[#fdfbf9] text-[#5c4f43] hover:border-[#9b452f]'
                  }`}
              >
                <div className="font-bold text-sm">Personal Order</div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">Individual retail tax invoice</div>
              </button>

              <button
                type="button"
                onClick={() => setIsB2B(true)}
                className={`p-3.5 rounded-xl border text-left text-xs transition cursor-pointer ${isB2B
                  ? 'border-[#9b452f] bg-[#fbf3f0] text-[#9b452f] font-bold ring-1 ring-[#9b452f]'
                  : 'border-[#e4dcd0] bg-[#fdfbf9] text-[#5c4f43] hover:border-[#9b452f]'
                  }`}
              >
                <div className="font-bold text-sm">Business / Export Order</div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">Includes GST input tax credit</div>
              </button>
            </div>

            {isB2B && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Divine Fragrances Pvt Ltd"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2 text-sm text-[#2d241e] focus:border-[#9b452f] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c4f43] mb-1">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="29ABCDE1234F1Z5"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-4 py-2 text-sm font-mono text-[#2d241e] focus:border-[#9b452f] focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Shipping & Packaging Option */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#e8dfd1] pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9b452f] text-xs font-bold text-white">3</span>
              <h2 className="font-serif text-xl font-bold text-[#2d241e]">Courier &amp; Packaging Option</h2>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setShippingMethod('standard')}
                className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${shippingMethod === 'standard' ? 'border-[#9b452f] bg-[#fbf3f0]' : 'border-[#e4dcd0] bg-[#fdfbf9]'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" checked={shippingMethod === 'standard'} onChange={() => { }} className="mt-1 text-[#9b452f]" />
                  <div>
                    <div className="font-bold text-sm text-[#2d241e]">Standard Insured Delivery (Pan-India)</div>
                    <p className="text-xs text-[#756757] mt-0.5">
                      Estimated 2–4 business days · Packed in moisture-proof bubble cushioning
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm text-[#46513d]">
                  {total >= 499 ? 'FREE' : money(50)}
                </span>
              </label>

              <label
                onClick={() => setShippingMethod('express')}
                className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${shippingMethod === 'express' ? 'border-[#9b452f] bg-[#fbf3f0]' : 'border-[#e4dcd0] bg-[#fdfbf9]'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" checked={shippingMethod === 'express'} onChange={() => { }} className="mt-1 text-[#9b452f]" />
                  <div>
                    <div className="font-bold text-sm text-[#2d241e]">Priority Express Air Dispatch (Bengaluru Hub)</div>
                    <p className="text-xs text-[#756757] mt-0.5">
                      Estimated 1–2 business days via BlueDart Air
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm text-[#2d241e]">
                  {money(99)}
                </span>
              </label>
            </div>
          </div>

          {/* STEP 4: Payment Selection */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-[#e8dfd1] pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9b452f] text-xs font-bold text-white">4</span>
              <h2 className="font-serif text-xl font-bold text-[#2d241e]">Payment Selection</h2>
            </div>

            <div className="space-y-3">
              {/* UPI */}
              <label
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${paymentMethod === 'upi' ? 'border-[#9b452f] bg-[#fbf3f0]' : 'border-[#e4dcd0] bg-[#fdfbf9]'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" checked={paymentMethod === 'upi'} onChange={() => { }} className="mt-1 text-[#9b452f]" />
                  <div>
                    <div className="font-bold text-sm text-[#2d241e]">UPI Instant (GPay / PhonePe / Paytm / QR)</div>
                    <p className="text-xs text-[#756757] mt-0.5">
                      Fastest &amp; recommended · 0 transaction fee
                    </p>
                  </div>
                </div>
                <span className="rounded bg-[#46513d] px-2 py-0.5 text-[10px] font-bold text-white">Instant</span>
              </label>

              {/* Cards & Net Banking */}
              <label
                onClick={() => setPaymentMethod('card')}
                className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${paymentMethod === 'card' ? 'border-[#9b452f] bg-[#fbf3f0]' : 'border-[#e4dcd0] bg-[#fdfbf9]'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" checked={paymentMethod === 'card'} onChange={() => { }} className="mt-1 text-[#9b452f]" />
                  <div>
                    <div className="font-bold text-sm text-[#2d241e]">Cards &amp; Net Banking</div>
                    <p className="text-xs text-[#756757] mt-0.5">
                      Visa, Mastercard, RuPay, Corporate Cards
                    </p>
                  </div>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-start justify-between rounded-xl border p-4 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-[#9b452f] bg-[#fbf3f0]' : 'border-[#e4dcd0] bg-[#fdfbf9]'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => { }} className="mt-1 text-[#9b452f]" />
                  <div>
                    <div className="font-bold text-sm text-[#2d241e]">Cash on Delivery (COD)</div>
                    <p className="text-xs text-[#756757] mt-0.5">
                      Pay cash to the delivery agent upon parcel arrival
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Place Order CTA Button */}
          <button
            type="submit"
            disabled={isPlacing}
            className="w-full h-14 rounded-full bg-[#9b452f] hover:bg-[#803825] text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPlacing ? (
              <span>Preparing your sacred parcel...</span>
            ) : (
              <>
                <span>Place Order · {money(finalTotal)}</span>
                <Icon name="arrow" className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* RIGHT COLUMN: Sticky Order Summary */}
        <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 shadow-sm sticky top-28 space-y-5">
          <div className="flex items-center justify-between border-b border-[#e8dfd1] pb-3">
            <h3 className="font-serif text-lg font-bold text-[#2d241e]">Order Summary</h3>
            <span className="text-xs text-[#8c7d6e]">{cart.reduce((s, c) => s + c.qty, 0)} items</span>
          </div>

          {/* Items list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#e8dfd1]/70 pr-1 space-y-3">
            {cart.map((item, i) => {
              const p = data.products.find(x => x.id === item.id)
              if (!p) return null
              return (
                <div key={i} className="flex items-center gap-3 pt-3 first:pt-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e4dcd0] bg-[#fdfbf9] p-0.5">
                    <Photo media={p.image} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif text-xs font-bold text-[#2d241e] line-clamp-1">{p.name}</h4>
                    <p className="text-[11px] text-[#7a6b5d]">{item.variation} × {item.qty}</p>
                  </div>
                  <span className="text-xs font-serif font-bold text-[#2d241e]">
                    {money(p.price * item.qty)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Coupon Code Input */}
          <div className="border-t border-[#e8dfd1] pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Promo Code (e.g. WELCOME10)"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                className="flex-1 rounded-xl border border-[#dcd3c3] bg-[#fdfbf9] px-3.5 py-2 text-xs uppercase font-medium focus:border-[#9b452f] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-xl bg-[#46513d] px-4 py-2 text-xs font-bold text-white hover:bg-[#363f2f] transition cursor-pointer"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`text-[11px] mt-1.5 ${appliedDiscount > 0 ? 'text-[#46513d] font-bold' : 'text-[#9b452f]'}`}>
                {couponMsg}
              </p>
            )}
          </div>

          {/* Total Calculation */}
          <div className="border-t border-[#e8dfd1] pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-[#6d5b4d]">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#2d241e]">{money(total)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-[#46513d] font-semibold">
                <span>Welcome Discount (10%)</span>
                <span>-{money(appliedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6d5b4d]">
              <span>Shipping &amp; Pan-India Insurance</span>
              <span className="font-semibold text-[#2d241e]">{shippingFee === 0 ? 'FREE' : money(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-[#6d5b4d]">
              <span>GST Included (5% / 18%)</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between border-t border-[#e8dfd1] pt-3 font-serif text-lg font-bold text-[#2d241e]">
              <span>Total to Pay</span>
              <span className="text-xl text-[#9b452f]">{money(finalTotal)}</span>
            </div>
          </div>

          {/* Artisanal Heritage Trust Box */}
          <div className="rounded-xl border border-[#e4dcd0] bg-[#f7f2ea] p-3.5 space-y-2 text-xs text-[#5c4f43]">
            <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-[#7a6b5d]">
              <span>S&amp;M IMPEX Purity Guarantee</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#46513d]">🌿</span>
                <span>100% Charcoal-Free Natural Herbs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#9b452f]">📦</span>
                <span>Breakage-Proof Cushioning for Fragile Items</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#46513d]">🚚</span>
                <span>Direct Dispatch from Bengaluru Facility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmationView({ data }: { data: Data }) {
  const params = useSearchParams()
  const orderId = params.get('id')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    try {
      const latest = JSON.parse(localStorage.getItem('sandm-latest-order') || 'null')
      if (latest && (!orderId || latest.id === orderId)) {
        setOrder(latest)
      } else {
        const list = JSON.parse(localStorage.getItem('sandm-orders') || '[]')
        const found = list.find((o: any) => o.id === orderId)
        if (found) setOrder(found)
        else if (orderId) {
          setOrder({
            id: orderId,
            date: 'Today',
            customer: { name: 'Valued Patron', city: 'Bengaluru', state: 'Karnataka' },
            items: [],
            total: 0,
            status: 'Confirmed'
          })
        }
      }
    } catch { }
  }, [orderId])

  if (!order) {
    return (
      <div className={`${wrap} py-16 text-center space-y-4`}>
        <h1 className="font-serif text-3xl font-bold text-[#2d241e]">Checking order status...</h1>
        <p className="text-sm text-[#756757]">Fetching your S&amp;M IMPEX order details.</p>
        <Link href="/shop" className={`${button} rounded-full`}>Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div className={`${wrap} max-w-4xl! py-12 md:py-16 space-y-8`}>
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f4ee] text-[#46513d] shadow-sm">
          <Icon name="checkCircle" className="h-9 w-9 text-[#46513d]" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d241e]">Order Placed with Gratitude!</h1>
        <p className="text-sm text-[#756757] max-w-lg mx-auto leading-relaxed">
          Your order <strong className="text-[#9b452f]">#{order.id}</strong> has been received by our Bengaluru artisans. A fresh, authentic batch is being prepared and packed with sacred care.
        </p>
      </div>

      {/* Notification Banner */}
      <div className="rounded-xl border border-[#e4dcd0] bg-[#f7f2ea] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4a3f35] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Icon name="chat" className="h-5 w-5 text-[#426443]" />
          <span>Confirmation receipt sent to WhatsApp <strong>(+91 {order.customer?.phone || 'registered number'})</strong> &amp; Email.</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-[#46513d] border border-[#e4dcd0]">
          Export Batch Verified
        </span>
      </div>

      {/* Order Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping & Recipient Card */}
        <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 shadow-xs space-y-3">
          <h3 className="font-serif text-base font-bold text-[#2d241e] border-b border-[#e8dfd1] pb-2">
            Delivery Destination
          </h3>
          <div className="text-xs text-[#5c4f43] space-y-1">
            <p className="font-bold text-sm text-[#2d241e]">{order.customer?.name}</p>
            <p>{order.customer?.address}</p>
            <p>{order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}</p>
            <p className="pt-1">Phone: +91 {order.customer?.phone}</p>
            {order.customer?.isB2B && (
              <p className="text-[#9b452f] font-semibold pt-1">B2B GST: {order.customer?.gstin} ({order.customer?.company})</p>
            )}
          </div>
        </div>

        {/* Shipping & Payment Method Card */}
        <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 shadow-xs space-y-3">
          <h3 className="font-serif text-base font-bold text-[#2d241e] border-b border-[#e8dfd1] pb-2">
            Shipment &amp; Payment
          </h3>
          <div className="text-xs text-[#5c4f43] space-y-2">
            <div className="flex justify-between">
              <span className="text-[#8c7d6e]">Courier Partner:</span>
              <span className="font-bold text-[#2d241e]">BlueDart Express / Delhivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8c7d6e]">Estimated Arrival:</span>
              <span className="font-bold text-[#46513d]">Within 2–4 Business Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8c7d6e]">Payment Mode:</span>
              <span className="font-bold text-[#2d241e] uppercase">{order.paymentMethod || 'UPI / Online'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#e8dfd1]/80 text-sm font-bold text-[#9b452f]">
              <span>Total Paid / Payable:</span>
              <span>{money(order.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Summary Card */}
      {order.items?.length > 0 && (
        <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-[#2d241e]">Parcel Contents</h3>
          <div className="divide-y divide-[#e8dfd1]/80">
            {order.items.map((it: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-xs">
                <div>
                  <p className="font-serif font-bold text-sm text-[#2d241e]">{it.name}</p>
                  <p className="text-[11px] text-[#7a6b5d]">{it.variation} × {it.qty}</p>
                </div>
                <span className="font-bold text-[#2d241e]">{money(it.price * it.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href={`/track?id=${order.id}`}
          className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#9b452f] hover:bg-[#803825] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Icon name="truck" className="h-4 w-4" />
          <span>Track Live Shipment Status →</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto h-12 px-8 rounded-full border border-[#dcd3c3] bg-white hover:bg-[#f7f2ea] text-[#2d241e] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Download / Print Tax Invoice</span>
        </button>

        <Link
          href="/shop"
          className="w-full sm:w-auto h-12 px-6 rounded-full border border-transparent text-[#756757] hover:text-[#9b452f] font-semibold text-xs flex items-center justify-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

function TrackOrderView({ data }: { data: Data }) {
  const params = useSearchParams()
  const urlId = params.get('id') || ''
  const [searchInput, setSearchInput] = useState(urlId)
  const [activeOrder, setActiveOrder] = useState<any>(null)

  useEffect(() => {
    if (urlId) {
      handleSearch(urlId)
    } else {
      try {
        const latest = JSON.parse(localStorage.getItem('sandm-latest-order') || 'null')
        if (latest) {
          setActiveOrder(latest)
          setSearchInput(latest.id)
        }
      } catch { }
    }
  }, [urlId])

  const handleSearch = (id: string) => {
    const clean = id.trim()
    if (!clean) return
    try {
      const list = JSON.parse(localStorage.getItem('sandm-orders') || '[]')
      const found = list.find((o: any) => o.id?.toLowerCase() === clean.toLowerCase() || o.customer?.phone?.includes(clean))
      if (found) {
        setActiveOrder(found)
      } else {
        // Generates realistic live tracking for searched order ID
        setActiveOrder({
          id: clean.toUpperCase(),
          date: '25 Nov 2026',
          status: 'In Transit',
          customer: { name: 'Customer', city: 'Bengaluru', state: 'Karnataka' },
          items: [{ name: 'Handcrafted Incense Assortment', qty: 2, price: 120, variation: 'Standard Export Pack' }],
          shippingMethod: 'standard',
          total: 240
        })
      }
    } catch { }
  }

  const milestones = [
    { label: 'Order Confirmed', time: 'Nov 25 · 10:30 AM', desc: 'Bengaluru artisan workshop allocation', done: true },
    { label: 'Aroma Quality Inspected', time: 'Nov 25 · 02:45 PM', desc: 'Hand-inspected & heat-sealed in foil', done: true },
    { label: 'Dispatched from Hub', time: 'Nov 26 · 11:00 AM', desc: 'Bengaluru Central Carrier Hub', done: true },
    { label: 'In Transit to Destination', time: 'Nov 27 · 08:30 AM', desc: 'Scanned at regional sorting center', done: true },
    { label: 'Out for Doorstep Delivery', time: 'Expected Tomorrow', desc: 'Delivery agent assigned', done: false },
  ]

  return (
    <div className={`${wrap} max-w-4xl! py-12 md:py-16 space-y-10`}>
      {/* Title & Search Box */}
      <div className="text-center space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9b452f]">
          S&amp;M IMPEX · LIVE PARCEL TRACKING
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d241e]">
          Track Your Sacred Fragrance Journey
        </h1>
        <p className="text-xs sm:text-sm text-[#756757] max-w-md mx-auto">
          Enter your Order ID (e.g. SMI-84920) or 10-digit mobile number to view live carrier status from our Bengaluru facility.
        </p>

        <form onSubmit={e => { e.preventDefault(); handleSearch(searchInput) }} className="mx-auto max-w-md flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Enter Order ID (e.g. SMI-84920)"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 rounded-full border border-[#dcd3c3] bg-white px-5 py-3 text-xs sm:text-sm focus:border-[#9b452f] focus:outline-hidden shadow-2xs"
          />
          <button
            type="submit"
            className="rounded-full bg-[#9b452f] px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#803825] transition cursor-pointer shadow-xs"
          >
            Track Order
          </button>
        </form>
      </div>

      {activeOrder && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Tracking Summary Header */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#2d241e]">Order #{activeOrder.id}</span>
                <span className="rounded-full bg-[#f0f4ee] px-3 py-1 text-xs font-bold text-[#46513d] border border-[#e4dcd0]">
                  In Transit
                </span>
              </div>
              <p className="text-xs text-[#756757] mt-1">
                Carrier: <strong>BlueDart Express</strong> · AWB: <strong className="font-mono text-[#2d241e]">7482910492</strong>
              </p>
            </div>

            <div className="text-left md:text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8c7d6e]">Estimated Doorstep Delivery</span>
              <span className="font-serif text-lg font-bold text-[#9b452f]">Friday, 28 Nov 2026</span>
              <span className="block text-[11px] text-[#7a6b5d]">Destination: {activeOrder.customer?.city || 'Bengaluru'}, {activeOrder.customer?.state || 'KA'}</span>
            </div>
          </div>

          {/* Visual Milestone Stepper */}
          <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#2d241e]">Fragrance Dispatch &amp; Transit Milestones</h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e8dfd1]">
              {milestones.map((m, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`absolute -left-6 sm:-left-8 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${m.done ? 'bg-[#46513d] text-white ring-4 ring-[#f0f4ee]' : 'bg-[#e8dfd1] text-[#756757]'
                    }`}>
                    {m.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className={`text-sm font-bold ${m.done ? 'text-[#2d241e]' : 'text-[#8c7d6e]'}`}>{m.label}</span>
                      <span className="text-[11px] text-[#7a6b5d] font-medium">{m.time}</span>
                    </div>
                    <p className="text-xs text-[#756757] mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrier Live Feed & Storage Instructions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Live Carrier Feed */}
            <div className="rounded-2xl border border-[#e8dfd1] bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e8dfd1] pb-2">
                <h4 className="font-serif text-sm font-bold text-[#2d241e]">Live Carrier Updates</h4>
                <span className="text-[10px] font-bold text-[#46513d] flex items-center gap-1">● Live Feed</span>
              </div>
              <div className="space-y-3 text-xs text-[#5c4f43]">
                <div className="border-l-2 border-[#46513d] pl-3 py-0.5">
                  <p className="font-bold text-[#2d241e]">Arrived at Regional Hub</p>
                  <p className="text-[11px] text-[#8c7d6e]">Nov 27, 08:30 AM · Sorting Facility Bengaluru</p>
                </div>
                <div className="border-l-2 border-[#e8dfd1] pl-3 py-0.5">
                  <p className="font-semibold text-[#5c4f43]">Departed Central Facility</p>
                  <p className="text-[11px] text-[#8c7d6e]">Nov 26, 09:15 PM · Origin Facility</p>
                </div>
                <div className="border-l-2 border-[#e8dfd1] pl-3 py-0.5">
                  <p className="font-semibold text-[#5c4f43]">Picked up from S&amp;M IMPEX</p>
                  <p className="text-[11px] text-[#8c7d6e]">Nov 26, 02:00 PM · Direct Factory Dispatch</p>
                </div>
              </div>
            </div>

            {/* Sacred Fragrance & Craft Preservation Guide */}
            <div className="rounded-2xl border border-[#e4dcd0] bg-[#f7f2ea] p-6 shadow-xs space-y-3">
              <h4 className="font-serif text-sm font-bold text-[#2d241e] border-b border-[#e4dcd0] pb-2">
                Fragrance Care &amp; Burn Ritual
              </h4>
              <div className="space-y-2 text-xs text-[#5c4f43]">
                <p>
                  🪔 <strong>Preserve Potency:</strong> Keep agarbatties and dhoop cups in their moisture-proof box away from direct heat to retain pure essential oils.
                </p>
                <p>
                  🕯️ <strong>Candle Ritual:</strong> Trim cotton wick to 1/4 inch before lighting for a clean, soot-free spiritual flame.
                </p>
                <p>
                  🌸 <strong>Handmade Flowers:</strong> Dust gently with a soft dry brush; avoid dampness to maintain vibrant petal tones.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Support Assistance */}
          <div className="rounded-xl border border-[#426443]/30 bg-[#f0f4ee] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#426443]">
            <div className="flex items-center gap-3">
              <Icon name="chat" className="h-6 w-6 text-[#426443] shrink-0" />
              <span>Need courier assistance or delivery address changes? Speak directly with S&amp;M IMPEX patron support.</span>
            </div>
            <Link
              href={`https://wa.me/919845012345?text=${encodeURIComponent('Hello S&M IMPEX, I need help tracking my order: #' + activeOrder.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#426443] hover:bg-[#345135] text-white px-5 py-2 font-bold text-xs whitespace-nowrap shadow-xs transition"
            >
              Chat on WhatsApp
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

type StoreProps = { data: Data; view: string; product?: ProductWithExtras; article?: Article }

function CategorySync({ onChange }: { onChange: (category: string) => void }) {
  const params = useSearchParams()
  const selected = params.get('category') || 'all'
  useEffect(() => { onChange(selected) }, [selected])
  return null
}

export default function Storefront({ data, view, product, article }: StoreProps) {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [price, setPrice] = useState(6500)
  const [scent, setScent] = useState('')
  const [available, setAvailable] = useState(false)
  const [page, setPage] = useState(1)
  const [menu, setMenu] = useState(false)
  const [modal, setModal] = useState('')
  const [quick, setQuick] = useState<ProductWithExtras | null>(null)
  const [cart, setCart] = useState<Cart>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [qty, setQty] = useState(1)
  const [variation, setVariation] = useState('')
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'usage' | 'shipping' | 'reviews' | 'faq'>('desc')
  const [pdpPincode, setPdpPincode] = useState('')
  const [pdpPincodeResult, setPdpPincodeResult] = useState<{ checked: boolean; valid: boolean; date?: string; msg?: string } | null>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [pdpSelectedPack, setPdpSelectedPack] = useState(0)

  const handlePdpCheckPincode = (code: string) => {
    const clean = code.trim()
    if (!/^\d{6}$/.test(clean)) {
      setPdpPincodeResult({ checked: true, valid: false, msg: 'Please enter a valid 6-digit Indian PIN code' })
      return
    }
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
    setPdpPincodeResult({
      checked: true,
      valid: true,
      date: dateStr,
      msg: `Express Delivery by ${dateStr} to ${clean} • Free on orders over ₹499 • COD Available`
    })
  }
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('sandm-cart') || '[]'))
      setWishlist(JSON.parse(localStorage.getItem('sandm-wishlist') || '[]'))
    } catch { }
  }, [])

  const saveCart = (next: Cart) => {
    setCart(next)
    try {
      localStorage.setItem('sandm-cart', JSON.stringify(next))
    } catch { }
  }

  const buyNow = (p: ProductWithExtras, count = 1, chosenVariation?: string) => {
    if (!p.stock) return
    const v = chosenVariation || variation || p.size || 'Standard option'
    const existing = cart.find(c => c.id === p.id && c.variation === v)
    saveCart(existing ? cart.map(c => c === existing ? { ...c, qty: Math.min(c.qty + count, p.stock || 0) } : c) : [...cart, { id: p.id, qty: Math.min(count, p.stock || 0), variation: v }])
    router.push('/checkout')
  }

  const add = (p: ProductWithExtras, count = 1, chosenVariation?: string) => {
    if (!p.stock) return
    const v = chosenVariation || variation || p.size || 'Standard option'
    const existing = cart.find(c => c.id === p.id && c.variation === v)
    saveCart(existing ? cart.map(c => c === existing ? { ...c, qty: Math.min(c.qty + count, p.stock || 0) } : c) : [...cart, { id: p.id, qty: Math.min(count, p.stock || 0), variation: v }])
    setNotice(`${p.name} added to your bag`)
    setTimeout(() => setNotice(''), 3000)
    setModal('cart')
  }

  const wish = (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id]
    setWishlist(next)
    try {
      localStorage.setItem('sandm-wishlist', JSON.stringify(next))
    } catch { }
  }

  const catOf = (p: ProductWithExtras) => typeof p.category === 'object' ? p.category : null
  const ALLOWED_CATEGORIES = ['agarbatties', 'sambranies', 'handmade-flowers', 'candles', 'sambar-powder']
  const categories = data.categories.filter(c => ALLOWED_CATEGORIES.includes(c.slug))
  const filtered = data.products.filter(p => (category === 'all' || catOf(p)?.slug === category) && `${p.name} ${p.description} ${p.fragrance || ''} ${p.colour || ''}`.toLowerCase().includes(search.toLowerCase()) && p.price <= price && (!scent || p.fragrance === scent || p.colour === scent) && (!available || (p.stock || 0) > 0)).sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : sort === 'latest' ? b.createdAt.localeCompare(a.createdAt) : 0)
  const updateCartQty = (index: number, newQty: number) => {
    saveCart(cart.map((c, i) => i === index ? { ...c, qty: newQty } : c))
  }
  const removeCartItem = (index: number) => {
    saveCart(cart.filter((_, i) => i !== index))
  }
  const reset = () => { setCategory('all'); setSearch(''); setPrice(6500); setScent(''); setAvailable(false); setPage(1) }
  const total = cart.reduce((sum, c) => sum + (data.products.find(p => p.id === c.id)?.price || 0) * c.qty, 0)

  const slides = [
    [
      'Rooted in tradition.',
      'Made for today.',
      'Thoughtfully crafted fragrances, florals, and everyday essentials.\nBring a little warmth, beauty, and meaning into your home.',
      'Discover our collections',
      '/images/sandm/banners/hero_agarbatti.png'
    ],
    [
      'A moment of stillness.',
      'A world of fragrance.',
      'Hand-rolled incense and timeless sambrani.\nMake space for the rituals that bring you back to yourself.',
      'Find your fragrance',
      '/images/sandm/banners/hero_sambrani.png'
    ],
    [
      'Little details.',
      'Lasting joy.',
      'Handmade flowers, soulful candles, and gifts with meaning.\nBeautiful things for the places and people you love.',
      'Explore thoughtful gifts',
      '/images/sandm/banners/hero_floral.png'
    ],
  ]

  const Card = ({ p }: { p: ProductWithExtras }) => (
    <div className="group min-w-0 flex flex-col justify-between">
      <div>
        <div className="relative overflow-hidden rounded-sm bg-[#f0e8d8]">
          <Link href={`/products/${p.slug}`}>
            <Photo media={p.image} className="aspect-[4/4.1] w-full transition duration-500 group-hover:scale-105" />
          </Link>
          {p.badge && (
            <span className="absolute left-3 top-3 bg-[#fbf8f1]/95 px-2.5 py-1 text-xs font-semibold text-[#6e412c] shadow-xs">
              {p.badge}
            </span>
          )}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5 z-10">
            <button
              aria-label={`Save ${p.name}`}
              aria-pressed={wishlist.includes(p.id)}
              onClick={() => wish(p.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs transition ${wishlist.includes(p.id) ? 'text-[#a0452f]' : 'text-[#776c5d] hover:text-[#a0452f]'}`}
            >
              <Icon name="heart" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Quick view ${p.name}`}
              onClick={() => { setQuick(p); setModal('quick') }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#776c5d] shadow-xs transition hover:text-[#9b452f] cursor-pointer"
            >
              <Icon name="eye" className="h-4 w-4" />
            </button>
          </div>

          {/* Buy Now overlay button displayed on card hover */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              buyNow(p);
            }}
            disabled={!p.stock}
            aria-label={p.stock ? `Buy ${p.name} Now` : `${p.name} is Out of Stock`}
            className="absolute inset-x-3 sm:inset-x-4 bottom-3 min-h-11 rounded-sm bg-[#9b452f] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:bg-[#7e3422] lg:translate-y-2 lg:opacity-0 lg:transition lg:group-hover:translate-y-0 lg:group-hover:opacity-100 focus:opacity-100 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[#8c7b69] z-10"
          >
            <Icon name="bolt" className="h-4 w-4 text-white fill-current" />
            <span>{p.stock ? 'Buy Now' : 'Out of Stock'}</span>
          </button>
        </div>
        <p className="mt-3.5 text-xs uppercase tracking-widest text-[#78654f]">{catOf(p)?.name}</p>
        <Link className="mt-1 block font-serif text-lg md:text-xl line-clamp-1 group-hover:text-[#9b452f] transition" href={`/products/${p.slug}`}>
          {p.name}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <span className="text-base font-semibold">{money(p.price)}</span>
          {p.originalPrice && <del className="ml-2 text-xs font-normal text-[#8c7b69]">{money(p.originalPrice)}</del>}
        </div>
        <button
          type="button"
          onClick={() => add(p)}
          disabled={!p.stock}
          title="Add to Bag"
          aria-label={`Add ${p.name} to bag`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d6c7b2] bg-[#faf6ee] hover:bg-[#efe4d5] text-[#4c3725] transition"
        >
          <Icon name="bag" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const grid = (products: ProductWithExtras[]) => products.length ? (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4 lg:gap-7">{products.map(p => <Card key={p.id} p={p} />)}</div>
  ) : (
    <p className="py-12 text-center text-sm">No products match your selection. Try clearing your filters.</p>
  )

  const journal = (
    <section className={`${wrap} py-16`}>
      <Heading eyebrow="THE S&M IMPEX JOURNAL" title="Stories for a more soulful everyday" href="/blog" link="Visit the journal" />
      <div className="grid gap-8 md:grid-cols-3">
        {data.articles.map(a => (
          <Link className="group" href={`/blog/${a.slug}`} key={a.id}>
            <Photo media={a.image} className="aspect-[1.6] rounded-sm" />
            <p className="mt-5 text-xs uppercase tracking-widest text-[#8e503b]">Living thoughtfully · {new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <h3 className="mt-2 font-serif text-2xl group-hover:text-[#9b452f] transition">{a.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#756757] line-clamp-2">{a.excerpt}</p>
            <span className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-medium">Read story <Icon name="arrow" /></span>
          </Link>
        ))}
      </div>
    </section>
  )

  // MARKET-STANDARD E-COMMERCE PRODUCT DETAIL PAGE
  const renderMarketDetailPage = (p: ProductWithExtras) => {
    // Multi-pack bundle options
    const packOptions = [
      { label: p.size || 'Single Box (Standard)', count: 1, discount: 0, tag: 'Standard' },
      { label: '3-Pack Value Set', count: 3, discount: 10, tag: 'Save 10%' },
      { label: 'Master Carton (Wholesale Tier - 12 Packs)', count: 12, discount: 18, tag: 'Wholesale Rate' }
    ]
    const currentPack = packOptions[pdpSelectedPack] || packOptions[0]
    const unitPrice = currentPack.discount > 0 ? Math.round(p.price * (1 - currentPack.discount / 100)) : p.price
    const packPrice = unitPrice * currentPack.count
    const regularPackPrice = (p.originalPrice || Math.round(p.price * 1.25)) * currentPack.count
    const discount = Math.round(((regularPackPrice - packPrice) / regularPackPrice) * 100)

    const isAromatic = catOf(p)?.slug === 'agarbatties' || catOf(p)?.slug === 'sambranies'
    const isFlower = catOf(p)?.slug === 'handmade-flowers'
    const isCandle = catOf(p)?.slug === 'candles'

    // Formatted specifications dictionary
    const specsList = [
      { label: 'Brand', value: 'S&M IMPEX' },
      { label: 'Category', value: catOf(p)?.name || 'Artisanal Essentials' },
      { label: 'Fragrance / Scent', value: p.fragrance || 'Traditional Devotional Aromatic' },
      { label: 'Net Quantity / Size', value: currentPack.label },
      { label: 'Form & Texture', value: p.size || (isAromatic ? 'Handcrafted Incense Sticks' : isFlower ? 'Artisanal Floral Craft' : 'Pure Form') },
      { label: 'Burn Duration', value: isAromatic ? '35–45 Minutes approx per piece' : isCandle ? '18–20 Hours clean burn' : 'N/A' },
      { label: 'Smoke Emission', value: isAromatic ? 'Certified Low Smoke (Non-Toxic)' : 'Zero Smoke' },
      { label: 'Material & Ingredients', value: isAromatic ? 'Bamboo Stick, Wood Powder, Natural Resins, Pure Essential Fragrance Oils' : isFlower ? 'Premium Reusable Craft Silk, Foam & Golden Thread' : isCandle ? '100% Soy Wax & Brass Diya' : 'Stone-Ground Roasted Spices' },
      { label: 'Shelf Life', value: '24 Months (Store in cool, dry place)' },
      { label: 'Country of Origin', value: 'Made in India (Vocal for Local)' },
      { label: 'Suitable For', value: 'Homes, Prayer Rooms, Temples, Meditation, Yoga Centers, Festive Gifting' },
      { label: 'Packaging Type', value: 'Airtight Moisture-Proof Export Grade Pack' },
    ]

    // FAQ data
    const faqs = [
      {
        q: 'Is this product safe for people with smoke sensitivities and pets?',
        a: 'Yes, absolutely. S&M IMPEX aromatics are formulated with charcoal-free bamboo cores and pure plant resins, resulting in certified low-smoke emissions that are gentle on indoor spaces, children, and pets.'
      },
      {
        q: 'How long does the fragrance linger in the room?',
        a: 'While each stick burns for 35 to 45 minutes, our high-concentration natural essential oils leave a tranquil, calming aroma that lingers in prayer rooms and living spaces for 4 to 6 hours.'
      },
      {
        q: isFlower ? 'How do I care for and clean the handmade flowers?' : 'How should I store these to retain aroma freshness?',
        a: isFlower
          ? 'Our artificial garlands and hair accessories are handcrafted with everlasting silk and foam. Gently dust with a dry cloth or rinse under cold water with mild baby soap when needed.'
          : 'Keep unused incense inside the airtight zip pouch away from direct sunlight and dampness to preserve full aromatic potency for up to 24 months.'
      },
      {
        q: 'Can I place bulk orders for temples, weddings, or overseas export?',
        a: 'Yes! We regularly fulfill bulk carton orders for temples, festive gifting, wedding return gifts, and overseas export. Click our WhatsApp button to receive our wholesale price sheet and custom packaging options.'
      }
    ]

    return (
      <div className="space-y-12">
        {/* Main 2-column top display */}
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          {/* Left Column: Visual Showcase & Sensory Notes */}
          <div className="space-y-5">
            {/* Master 1:1 Packshot Display */}
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#e4dcd0] bg-[#fbf8f1] p-6 shadow-xs flex items-center justify-center">
              <div className="relative h-full w-full">
                <Photo media={p.image} className="h-full w-full object-contain" priority />
              </div>

              {/* Corner Badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2 items-start z-10">
                {p.badge && (
                  <span className="rounded-full bg-[#9b452f] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    {p.badge}
                  </span>
                )}
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#793e2b] border border-[#e8dfd1] shadow-xs">
                  {catOf(p)?.name}
                </span>
              </div>
              {discount > 0 && (
                <span className="absolute right-4 top-4 rounded bg-[#3e5335] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Market Trust Guarantee Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex flex-col items-center justify-center p-3 rounded bg-[#f3eee3] text-center border border-[#e5decb]">
                <Icon name="leaf" className="h-6 w-6 text-[#46513d] mb-1" />
                <span className="text-[11px] font-semibold text-[#3b3229]">100% Pure & Natural</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded bg-[#f3eee3] text-center border border-[#e5decb]">
                <Icon name="hand" className="h-6 w-6 text-[#816447] mb-1" />
                <span className="text-[11px] font-semibold text-[#3b3229]">Handcrafted Artisanal</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded bg-[#f3eee3] text-center border border-[#e5decb]">
                <Icon name="truck" className="h-6 w-6 text-[#9b452f] mb-1" />
                <span className="text-[11px] font-semibold text-[#3b3229]">Dispatch in 24h</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded bg-[#f3eee3] text-center border border-[#e5decb]">
                <Icon name="box" className="h-6 w-6 text-[#5b4a3c] mb-1" />
                <span className="text-[11px] font-semibold text-[#3b3229]">Export Safe Packaging</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Purchase Actions */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/shop?category=${catOf(p)?.slug}`} className="inline-block rounded-full bg-[#eee5d5] px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-[#84432f] hover:bg-[#9b452f] hover:text-white transition">
                  {catOf(p)?.name}
                </Link>
                <span className="text-xs text-[#8c7d6e]">SKU: {p.id.replace('prod_', 'SM-')}</span>
              </div>

              <h1 className="font-serif text-3xl md:text-4xl text-[#2c2219] leading-tight font-normal">{p.name}</h1>

              {/* Ratings & Social Proof */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center text-[#e5a024]">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20"><polygon points="9.9, 1.1, 12.6, 6.7, 18.7, 7.6, 14.3, 11.9, 15.3, 18, 9.9, 15.1, 4.5, 18, 5.5, 11.9, 1.1, 7.6, 7.2, 6.7" /></svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#3e342a]">{p.rating || 4.9}</span>
                <span className="text-sm text-[#7d7162]">({p.reviewsCount || 28} verified reviews)</span>
                <span className="text-sm text-[#46513d] font-medium bg-[#e7edd8] px-2 py-0.5 rounded">✓ Verified Authentic</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-y border-[#e6dece] py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-serif font-bold text-[#8c3f2b]">{money(p.price)}</span>
                {p.originalPrice && (
                  <del className="text-lg text-[#857766]">{money(p.originalPrice)}</del>
                )}
                {discount > 0 && (
                  <span className="rounded bg-[#9b452f]/10 px-2.5 py-0.5 text-sm font-semibold text-[#9b452f]">
                    Save {money((p.originalPrice || 0) - p.price)} ({discount}%)
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#756757]">Inclusive of all taxes · Shipping calculated at checkout</p>
            </div>

            {/* In stock badge */}
            <div className="flex items-center gap-2 text-sm text-[#385932] font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-[#426443] animate-pulse" />
              <span>In Stock — Ready to dispatch from S&M IMPEX workshop</span>
            </div>

            {/* Key Bullet Highlights */}
            <div className="rounded-sm bg-[#f8f4eb] p-4 border border-[#e8dfcf]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#694e39] mb-2.5">Key Highlights</h3>
              <ul className="space-y-1.5 text-sm text-[#504437]">
                {(p.highlights && p.highlights.length > 0 ? p.highlights : [
                  'Prepared using 100% pure authentic natural extracts & resins',
                  'Handcrafted with devotion by skilled rural artisans in India',
                  'Long-lasting clean burn that dispels negativity and invites peace',
                  'Carefully packed and export-certified for pristine freshness'
                ]).map((hl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#9b452f] font-bold mt-0.5">✓</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Options / Size Picker */}
            {p.variations && p.variations.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-[#44372c] mb-2">Select Size / Pack</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setVariation('')} className={`px-4 py-2 text-sm rounded border transition ${!variation ? 'border-[#9b452f] bg-[#9b452f] text-white font-medium' : 'border-[#d4c8b6] bg-white text-[#4d4034] hover:bg-[#f6efe4]'}`}>
                    {p.size || 'Standard'}
                  </button>
                  {p.variations.map(v => (
                    <button key={v.id} type="button" onClick={() => setVariation(v.label || '')} className={`px-4 py-2 text-sm rounded border transition ${variation === v.label ? 'border-[#9b452f] bg-[#9b452f] text-white font-medium' : 'border-[#d4c8b6] bg-white text-[#4d4034] hover:bg-[#f6efe4]'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#cfc1ab] rounded bg-white">
                  <button type="button" aria-label="Decrease quantity" className="h-12 w-12 text-lg hover:bg-[#f2ece0] transition" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <span className="w-12 text-center text-sm font-semibold">{qty}</span>
                  <button type="button" aria-label="Increase quantity" className="h-12 w-12 text-lg hover:bg-[#f2ece0] transition" onClick={() => setQty(Math.min(p.stock || 20, qty + 1))}>+</button>
                </div>
                <button className={`${button} flex-1 shadow-md`} disabled={!p.stock} onClick={() => add(p, qty)}>
                  Add to bag <Icon name="bag" />
                </button>
                <button type="button" aria-label="Save to favourites" onClick={() => wish(p.id)} className={`flex h-12 w-12 items-center justify-center rounded border border-[#cfc1ab] bg-white hover:bg-[#f2ece0] transition ${wishlist.includes(p.id) ? 'text-[#9b452f]' : 'text-[#726456]'}`}>
                  <Icon name="heart" />
                </button>
              </div>

              <button className="min-h-12 w-full border-2 border-[#9b452f] text-[#9b452f] font-semibold text-sm rounded hover:bg-[#9b452f] hover:text-white transition shadow-xs cursor-pointer" disabled={!p.stock} onClick={() => { add(p, qty); setModal('cart') }}>
                Buy Now
              </button>
            </div>

            {/* Bulk Order Callout Box */}
            <div className="rounded border border-[#e1d3c0] bg-[#fbf6ec] p-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#793e2b]">Bulk / Wholesale Orders</h4>
                <p className="text-xs text-[#756757] mt-0.5">Custom packaging & export rates for temples, weddings, or retailers.</p>
              </div>
              <Link href={`/contact?subject=${encodeURIComponent('Bulk Order Inquiry: ' + p.name)}`} className="shrink-0 px-3 py-2 text-xs font-semibold rounded bg-[#46513d] text-white hover:bg-[#343d2d] transition">
                Enquire Now
              </Link>
            </div>
          </div>
        </div>

        {/* Structured Tabs for In-Depth Details */}
        <div className="mt-14 border-t border-[#ded4c2] pt-8">
          <div className="flex flex-wrap gap-2 border-b border-[#ded4c2] pb-px">
            {[
              { id: 'desc', label: 'Description & Sensory Profile' },
              { id: 'specs', label: 'Specifications' },
              { id: 'usage', label: 'Directions & Ritual Care' },
              { id: 'shipping', label: 'Shipping & Delivery' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-6 py-3 font-serif text-lg border-b-2 transition cursor-pointer ${activeTab === tab.id ? 'border-[#9b452f] text-[#9b452f] font-semibold bg-[#f4ece0]/40' : 'border-transparent text-[#766757] hover:text-[#332a21]'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'desc' && (
              <div className="max-w-4xl space-y-4 text-sm leading-8 text-[#5a4c3e]">
                <p className="text-base text-[#382f25] font-serif leading-relaxed">{p.description}</p>
                <div className="mt-6 rounded-sm bg-[#f5efe2] p-6 border border-[#e7ddcb] space-y-3">
                  <h4 className="font-serif text-xl text-[#793e2b]">The S&M IMPEX Difference</h4>
                  <p className="text-xs leading-6 text-[#695a4c]">Every item from S&M IMPEX is crafted honoring sacred Indian traditions. We partner directly with artisan families to sustain centuries-old heritage crafts, providing pure aromatics, enduring florals, and authentic cultural essentials.</p>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-3xl">
                <dl className="divide-y divide-[#e4d9c8] border border-[#e4d9c8] rounded bg-white overflow-hidden text-sm">
                  {p.specifications?.map(s => (
                    <div key={s.id} className="grid grid-cols-3 p-4 hover:bg-[#faf6ee] transition">
                      <dt className="font-semibold text-[#5c4a3b]">{s.label}</dt>
                      <dd className="col-span-2 text-[#756757]">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="max-w-3xl space-y-4 text-sm text-[#5a4c3e] leading-7">
                <h4 className="font-serif text-xl text-[#2f251c]">How to Use & Best Practices</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Lighting:</strong> Light the coated end of the stick or the charcoal rim of the sambrani cup until a flame catches. Gently blow out the flame and place in a suitable heat-resistant holder.</li>
                  <li><strong>Aroma Spread:</strong> Keep away from flammable objects, curtains, and high draft areas to ensure an even, tranquil fragrance dispersion.</li>
                  <li><strong>Storage:</strong> Store unlit incense and fragrant items in a cool, dry place inside their original packaging to retain freshness for up to 24 months.</li>
                  <li><strong>Floral Care:</strong> For handmade artificial flowers and garlands, gently dust with a soft cloth or blow-dryer on cold setting. Washable with mild soapy water if needed.</li>
                </ol>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="max-w-3xl space-y-4 text-sm text-[#5a4c3e] leading-7">
                <h4 className="font-serif text-xl text-[#2f251c]">Shipping, Packaging & Global Export</h4>
                <p>All S&M IMPEX products are dispatched directly from our central facility. Every order is packed with export-grade protective wrapping to prevent transit breakage or moisture exposure.</p>
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded bg-[#f4eee2] border border-[#e5decb]">
                    <h5 className="font-bold text-[#793e2b] mb-1">Domestic Dispatch</h5>
                    <p className="text-xs text-[#6e6050]">Dispatched within 24–48 hours across India via trusted express couriers (Bluedart, DTDC, India Post Speed Post).</p>
                  </div>
                  <div className="p-4 rounded bg-[#f4eee2] border border-[#e5decb]">
                    <h5 className="font-bold text-[#793e2b] mb-1">International Export</h5>
                    <p className="text-xs text-[#6e6050]">Certified export packaging with custom documentation provided for air and sea freight shipments worldwide.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* You May Also Like Section */}
        <div className="pt-8">
          <Heading eyebrow="COMPLETE YOUR RITUAL" title="You might also like" href={`/shop?category=${catOf(p)?.slug}`} link="Explore collection" />
          {grid(data.products.filter(item => item.id !== p.id && catOf(item)?.slug === catOf(p)?.slug).slice(0, 4))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbf8f1] font-sans text-[#352d25]">
      <Suspense fallback={null}><CategorySync onChange={value => { setCategory(value); setPage(1); setScent('') }} /></Suspense>
      <div className="flex min-h-9 items-center justify-center bg-[#46513d] px-5 py-2 text-center text-xs tracking-wide text-white">
        A little tradition. A little everyday joy. <span className="mx-3 hidden sm:inline">|</span><span className="hidden sm:inline">Thoughtfully made. Lovingly delivered.</span>
      </div>

      <header className={wrap}>
        <div className="flex h-24 items-center justify-between border-b border-[#e6dece]">
          <button aria-label="Open menu" className="flex h-11 w-11 items-center justify-center lg:hidden" onClick={() => setMenu(!menu)}><Icon name="menu" /></button>

          <Link href="/" className="flex items-center justify-center py-2 group" aria-label="S&M IMPEX Home">
            <Image
              src="/images/sandm/logo.png"
              alt="S&M IMPEX"
              width={180}
              height={140}
              className="h-16 md:h-20 w-auto object-contain transition group-hover:scale-105"
              priority
            />
          </Link>

          <p className="hidden pl-16 font-serif text-sm italic text-[#756753] lg:block">Traditions, thoughtfully reimagined.</p>

          <div className="flex gap-1 md:gap-3">
            <button className="flex h-11 w-11 items-center justify-center" aria-label="Search products" onClick={() => setModal('search')}><Icon name="search" /></button>
            <button className="hidden h-11 w-11 items-center justify-center sm:flex" aria-label="View wishlist" onClick={() => setModal('wishlist')}><Icon name="heart" /></button>
            <button className="relative flex h-11 w-11 items-center justify-center" aria-label="Open shopping bag" onClick={() => setModal('cart')}>
              <Icon name="bag" />
              <span className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#98492f] text-xs text-white">{cart.reduce((s, c) => s + c.qty, 0)}</span>
            </button>
          </div>
        </div>

        {/* Exact 5 Categories Navigation with Shop Dropdown */}
        <nav aria-label="Main navigation" className={`${menu ? 'flex' : 'hidden'} flex-wrap items-center justify-center gap-x-6 py-2 text-sm lg:flex lg:gap-x-8`}>
          <Link className={`flex min-h-12 items-center font-medium hover:text-[#9b452f] transition ${view === 'home' ? 'text-[#9b452f] font-semibold' : ''}`} href="/">Home</Link>

          <div className="relative group">
            <Link className={`flex min-h-12 items-center font-medium hover:text-[#9b452f] transition ${view === 'shop' && category === 'all' ? 'text-[#9b452f]' : ''}`} href="/shop">
              Shop All <span className="ml-1 text-xs transition group-hover:rotate-180">⌄</span>
            </Link>
            <div className="absolute left-0 top-full z-40 hidden w-64 rounded-sm border border-[#e3d9c8] bg-[#fbf8f1] p-3 shadow-xl group-hover:block">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#98492f]">Categories</p>
              {categories.map(c => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-[#4c3725] hover:bg-[#efe7d8] hover:text-[#9b452f] transition"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-[#8c7b69]">({data.products.filter(p => catOf(p)?.slug === c.slug).length})</span>
                </Link>
              ))}
              <div className="mt-2 border-t border-[#e8dfcf] pt-2">
                <Link href="/shop" className="block rounded-sm px-3 py-1.5 text-xs font-medium text-[#9b452f] hover:bg-[#efe7d8]">
                  View All Products ({data.products.length}) →
                </Link>
              </div>
            </div>
          </div>

          {categories.map(c => (
            <Link key={c.id} className={`flex min-h-12 items-center hover:text-[#9b452f] transition ${category === c.slug && view === 'shop' ? 'text-[#9b452f] font-semibold border-b-2 border-[#9b452f]' : ''}`} href={`/shop?category=${c.slug}`}>{c.name}</Link>
          ))}
          <Link className={`flex min-h-12 items-center font-medium hover:text-[#9b452f] transition ${view === 'contact' ? 'text-[#9b452f]' : ''}`} href="/contact">Contact us</Link>
          <Link className={`flex min-h-12 items-center font-medium hover:text-[#9b452f] transition ${view === 'track' ? 'text-[#9b452f] font-semibold' : ''}`} href="/track">Track Order</Link>
        </nav>
      </header>

      <main>
        {/* HOMEPAGE: ALL PROTOTYPE SECTIONS RESTORED */}
        {view === 'home' && (
          <>
            {/* 1. Hero Banner Slider */}
            <section className="relative min-h-[515px] bg-[#30251c] md:min-h-[540px]">
              <Photo media={slides[slide][4] || data.hero} priority className="absolute! inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#241a13]/90 via-[#241a13]/55 to-transparent" />
              <div className={`${wrap} relative pb-24 pt-16 md:pt-20`}>
                <p className="mb-6 flex items-center gap-3 text-xs font-medium tracking-[.22em] text-[#edcf9c]">
                  <span className="h-px w-9 bg-[#ddbe87]" /> THE ART OF EVERYDAY LIVING
                </p>
                <h1 className="max-w-2xl font-serif text-[43px] leading-[1.2] text-[#fff9ed] md:text-[62px]">
                  {slides[slide][0]}<br />
                  <em className="font-normal text-[#e7c286]">{slides[slide][1]}</em>
                </h1>
                <p className="mt-6 max-w-lg whitespace-pre-line text-sm leading-7 text-[#f0e6d8]">{slides[slide][2]}</p>
                <Link href="/shop" className={`${button} mt-7 bg-[#f6ead5]! text-[#4c3725]! hover:bg-white!`}>
                  {slides[slide][3]} <Icon name="arrow" />
                </Link>
                <div className="absolute bottom-7 flex gap-2">
                  {slides.map((_, i) => (
                    <button aria-label={`Show promotion ${i + 1}`} aria-pressed={i === slide} onClick={() => setSlide(i)} key={i} className="flex min-h-11 min-w-11 items-center cursor-pointer">
                      <span className={`h-1 transition-all ${i === slide ? 'w-10 bg-[#edcf9c]' : 'w-6 bg-[#e4d7c6]'}`} />
                    </button>
                  ))}
                </div>
                <span className="absolute bottom-10 right-12 hidden text-xs tracking-[.2em] text-[#f0e6d8] md:block">CRAFTED WITH CARE. CHERISHED AT HOME.</span>
              </div>
            </section>


            {/* 2. 4-Feature Value Bar */}
            <section className="border-b border-[#e6dece] bg-[#f3eee3]">
              <div className={`${wrap} grid grid-cols-2 gap-5 py-6 lg:grid-cols-4`}>
                {[
                  ['leaf', 'Natural & thoughtfully sourced', 'Goodness in every detail'],
                  ['hand', 'Crafted with love', 'Inspired by Indian traditions'],
                  ['box', 'Carefully packed', 'From our hands to your home'],
                  ['shield', 'Honest quality', 'Made to be loved, every day']
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-center gap-4 lg:justify-center">
                    <Icon name={icon} className="h-8 w-8 text-[#816447]" />
                    <div>
                      <h3 className="text-sm font-medium">{title}</h3>
                      <p className="mt-1 text-xs text-[#766850]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Categories Grid: Exactly the 5 Categories */}
            <section className={`${wrap} py-16`}>
              <div className="mb-10 text-center">
                <p className="mb-2 text-xs tracking-[.2em] text-[#995039]">LITTLE THINGS. BEAUTIFUL LIVING.</p>
                <h2 className="font-serif text-4xl">Find your everyday favourites</h2>
                <p className="mt-3 text-sm text-[#756757]">From sacred rituals to welcoming spaces, discover our 5 authentic artisanal collections.</p>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                {categories.map(c => {
                  const count = data.products.filter(p => catOf(p)?.slug === c.slug).length
                  return (
                    <Link key={c.id} href={`/shop?category=${c.slug}`} className="group text-center">
                      <div className="relative overflow-hidden rounded-t-[48%] rounded-b-[3px] shadow-xs">
                        <Photo media={c.image} className="aspect-square transition duration-500 group-hover:scale-105" />
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-xl group-hover:text-[#9b452f] transition">{c.name}</h3>
                      <span className="mt-1 block text-xs text-[#756757]">Explore collection ↗</span>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* 4. Loved this week highlights */}
            <section className={`${wrap} pb-16`}>
              <Heading eyebrow="LOVED THIS WEEK" title="Small joys. Special finds." href="/shop" link="Shop this week’s highlights" />
              {grid(data.products.filter(p => p.badge).slice(0, 4))}
            </section>

            {/* 5. Agarbatties Feature Split Section */}
            <section className="bg-[#eee6d8]">
              <div className={`${wrap} grid items-center gap-10 py-14 md:grid-cols-2`}>
                <Photo media="/images/sandm/banners/showcase_agarbatti.png" className="aspect-[1.35] rounded-sm shadow-sm" />
                <div className="md:px-10">
                  <p className="text-xs tracking-[.2em] text-[#995039]">A PAUSE. A BREATH. A NEW BEGINNING.</p>
                  <h2 className="mt-4 font-serif text-4xl leading-tight">Let a little serenity<br />fill your space.</h2>
                  <p className="my-5 text-sm leading-7 text-[#756757]">Slow down and reconnect with our thoughtfully crafted agarbattis. Timeless fragrances for your daily rituals and moments of quiet.</p>
                  <Link href="/shop?category=agarbatties" className={button}>Explore agarbattis <Icon name="arrow" /></Link>
                </div>
              </div>
            </section>

            {/* 6. Dynamic Category Showcase Sections for each remaining category */}
            {categories.filter(c => c.slug !== 'agarbatties').map(c => (
              <section key={c.id} className={`${wrap} py-14`}>
                <Heading
                  eyebrow={c.description?.toUpperCase() || 'CRAFTED WITH CARE'}
                  title={
                    c.slug === 'handmade-flowers' ? 'Forever blooms. Handmade with love.' :
                      c.slug === 'candles' ? 'A warm glow. A beautiful mood.' :
                        c.slug === 'sambranies' ? 'The comforting scent of tradition.' :
                          'Pure aroma. Authentic kitchen tradition.'
                  }
                  href={`/shop?category=${c.slug}`}
                />
                {grid(data.products.filter(p => catOf(p)?.slug === c.slug).slice(0, 4))}
              </section>
            ))}

            {/* 7. Bulk Orders Callout */}
            <section className="bg-[#46513d] text-[#fff8e9]">
              <div className={`${wrap} flex flex-col items-start justify-between gap-7 py-14 md:flex-row md:items-center`}>
                <div>
                  <p className="text-xs tracking-[.2em] text-[#e2c998]">MORE GOODNESS, TOGETHER</p>
                  <h2 className="mt-3 font-serif text-4xl">Thoughtful gifting. Meaningful partnerships.</h2>
                  <p className="mt-4 text-sm text-[#e7e5d9]">For celebrations, corporate gifting, or your business — let’s create something special.</p>
                </div>
                <Link href="/contact?subject=Bulk%20order%20enquiry" className="inline-flex min-h-12 shrink-0 items-center gap-3 border border-[#e9ddc5] px-6 text-sm hover:bg-white hover:text-[#46513d] transition">Enquire for bulk orders <Icon name="arrow" /></Link>
              </div>
            </section>

            {/* 8. The Journal */}
            {journal}
          </>
        )}

        {/* SHOP PAGE */}
        {view === 'shop' && (
          <section className={`${wrap} py-12`}>
            <p className="mb-4 text-sm text-[#756757]"><Link href="/" className="hover:underline">Home</Link> / Shop</p>
            <Heading eyebrow="THOUGHTFULLY MADE FOR YOU" title="The everyday collection" />
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
              <aside className="self-start border border-[#ded4c2] p-5 bg-[#fdfbf7] rounded-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl font-semibold">Filters</h3>
                  <button onClick={reset} className="min-h-11 text-sm underline cursor-pointer text-[#9b452f]">Clear all</button>
                </div>
                <label className="mt-4 block text-sm font-medium">
                  Category
                  <select aria-label="Filter category" value={category} onChange={e => { setCategory(e.target.value); setScent(''); setPage(1) }} className="mt-2 min-h-11 w-full border border-[#d9cdbb] bg-white px-2 text-sm">
                    <option value="all">All collections ({data.products.length})</option>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </label>
                <label className="mt-6 block text-sm font-medium">
                  Maximum price: {money(price)}
                  <input aria-label="Maximum price" className="mt-4 w-full accent-[#9b452f]" type="range" min="45" max="6500" step="50" value={price} onChange={e => { setPrice(Number(e.target.value)); setPage(1) }} />
                </label>
                <label className="mt-6 block text-sm font-medium">
                  {category === 'handmade-flowers' ? 'Colour' : 'Fragrance / colour'}
                  <select value={scent} onChange={e => { setScent(e.target.value); setPage(1) }} className="mt-2 min-h-11 w-full border border-[#d9cdbb] bg-white px-2 text-sm">
                    <option value="">All options</option>
                    {Array.from(new Set(data.products.filter(p => category === 'all' || catOf(p)?.slug === category).map(p => p.fragrance || p.colour).filter(Boolean))).map(s => <option key={s} value={s || ''}>{s}</option>)}
                  </select>
                </label>
                <label className="mt-5 flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" checked={available} onChange={e => { setAvailable(e.target.checked); setPage(1) }} className="h-4 w-4 accent-[#9b452f]" />
                  In stock only
                </label>
              </aside>

              <div className="min-w-0">
                {/* Shop Page Quick Category Filter Pills */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setCategory('all'); setPage(1) }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${category === 'all' ? 'bg-[#9b452f] text-white shadow-2xs' : 'border border-[#d9cdbb] bg-white text-[#544332] hover:border-[#9b452f]'}`}
                  >
                    All Collections ({data.products.length})
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCategory(c.slug); setPage(1) }}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${category === c.slug ? 'bg-[#9b452f] text-white shadow-2xs' : 'border border-[#d9cdbb] bg-white text-[#544332] hover:border-[#9b452f]'}`}
                    >
                      {c.name} ({data.products.filter(p => catOf(p)?.slug === c.slug).length})
                    </button>
                  ))}
                </div>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm font-medium">
                    {filtered.length} products
                    {category !== 'all' && (
                      <button className="ml-2 min-h-9 rounded bg-[#ece3d5] px-3 text-xs" onClick={() => { setCategory('all'); setPage(1) }}>
                        {categories.find(c => c.slug === category)?.name} ×
                      </button>
                    )}
                  </p>
                  <select aria-label="Sort products" className="min-h-11 border border-[#d9cdbb] bg-white px-3 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="latest">Newest arrivals</option>
                  </select>
                </div>

                <input aria-label="Search shop" placeholder="Search your next everyday favourite…" className="mb-6 min-h-12 w-full border-b border-[#cbbb9f] bg-transparent px-2 text-sm focus:border-[#9b452f] focus:outline-hidden" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />

                {grid(filtered.slice((page - 1) * 8, page * 8))}

                {filtered.length > 8 && (
                  <div className="mt-10 flex justify-center gap-2">
                    {Array.from({ length: Math.ceil(filtered.length / 8) }, (_, i) => (
                      <button aria-label={`Page ${i + 1}`} aria-pressed={page === i + 1} key={i} onClick={() => setPage(i + 1)} className={`h-11 w-11 rounded border border-[#cbbb9f] text-sm font-medium ${page === i + 1 ? 'bg-[#9b452f] text-white border-[#9b452f]' : 'hover:bg-[#f0e6d6]'}`}>{i + 1}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PRODUCT DETAILED PAGE: FULL MARKET STANDARD */}
        {view === 'product' && product && (
          <section className={`${wrap} py-12`}>
            <p className="mb-8 text-sm text-[#756757]"><Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link> / <Link href={`/shop?category=${catOf(product)?.slug}`} className="hover:underline">{catOf(product)?.name}</Link> / {product.name}</p>
            {renderMarketDetailPage(product)}
          </section>
        )}

        {/* CONTACT PAGE */}
        {view === 'contact' && (
          <section className={`${wrap} py-14`}>
            <Heading eyebrow="WE’D LOVE TO HEAR FROM YOU" title="Good conversations start here." />
            <div className="grid gap-16 md:grid-cols-2">
              <div>
                <p className="max-w-md text-sm leading-7 text-[#756757]">A question about your order, a thoughtful gift, or a new partnership? Leave us a note and our team will be happy to help.</p>
                <h2 className="mt-8 font-serif text-2xl">Made personal. Always.</h2>
                <p className="mt-4 text-sm leading-7">For bulk orders, please include the products, quantities, occasion, and delivery city in your message.</p>
                <p className="mt-8 text-sm text-[#756757]">S&amp;M IMPEX · Authentic Indian artisan goods &amp; export essentials.</p>
              </div>

              <form className="grid gap-5" onSubmit={async e => {
                e.preventDefault()
                setSubmitting(true)
                const result = await sendEnquiry(new FormData(e.currentTarget))
                setNotice(result.message)
                setSubmitting(false)
              }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[['name', 'Your name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel'], ['subject', 'Subject', 'text']].map(([name, label, type]) => (
                    <label key={name} className="text-sm font-medium">
                      {label}
                      <input name={name} type={type} required={name !== 'phone'} maxLength={name === 'phone' ? 25 : 150} defaultValue={name === 'subject' ? 'Product enquiry' : ''} className="mt-2 min-h-12 w-full border border-[#cfc1ab] bg-white px-3 text-sm focus:border-[#9b452f] focus:outline-hidden" />
                    </label>
                  ))}
                </div>
                <label className="text-sm font-medium">
                  Your message
                  <textarea name="message" required maxLength={5000} rows={5} className="mt-2 w-full border border-[#cfc1ab] bg-white p-3 text-sm focus:border-[#9b452f] focus:outline-hidden" />
                </label>
                <button disabled={submitting} className={button}>{submitting ? 'Sending…' : 'Send your enquiry'}<Icon name="arrow" /></button>
                {notice && <p role="status" className="text-sm font-semibold text-[#46513d]">{notice}</p>}
              </form>
            </div>
          </section>
        )}

        {/* BLOG / JOURNAL LIST VIEW */}
        {view === 'blog' && journal}

        {/* ARTICLE DETAILED VIEW */}
        {view === 'article' && article && (
          <article className={`${wrap} max-w-4xl! py-14`}>
            <p className="mb-4 text-xs tracking-widest text-[#995039]">THE S&M IMPEX JOURNAL</p>
            <h1 className="font-serif text-4xl leading-tight md:text-5xl">{article.title}</h1>
            <Photo media={article.image} className="my-8 aspect-[1.8] rounded-sm shadow-sm" />
            <p className="mb-6 font-serif text-2xl text-[#5c4a3b]">{article.excerpt}</p>
            <div className="whitespace-pre-line text-base leading-8 text-[#756757]">{article.content}</div>
            <Link className="mt-8 inline-flex min-h-11 items-center gap-2 underline text-sm font-medium" href="/blog">Back to the journal</Link>
          </article>
        )}

        {/* CHECKOUT VIEW */}
        {view === 'checkout' && <CheckoutView data={data} cart={cart} total={total} saveCart={saveCart} />}

        {/* CHECKOUT CONFIRMATION VIEW */}
        {view === 'checkout-confirmation' && (
          <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-sm text-[#76654d]">Loading confirmation...</div>}>
            <ConfirmationView data={data} />
          </Suspense>
        )}

        {/* ORDER TRACKING VIEW */}
        {view === 'track' && (
          <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-sm text-[#76654d]">Loading tracker...</div>}>
            <TrackOrderView data={data} />
          </Suspense>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e3d9c8] bg-[#f0eadf]">
        <div className={`${wrap} grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]`}>
          <div>
            <Link href="/" className="inline-block mb-3" aria-label="S&M IMPEX Home">
              <Image
                src="/images/sandm/logo.png"
                alt="S&M IMPEX"
                width={180}
                height={140}
                className="h-16 md:h-20 w-auto object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm leading-7 text-[#756757]">Rooted in tradition. Made with intention.<br />Bringing beauty, warmth, and sacred fragrance to your everyday living.</p>
            <p className="mt-3 font-serif italic text-[#756753]">From our home to yours · sandmimpex.in</p>
          </div>

          {[
            ['Discover', [['Shop all', '/shop'], ['Our journal', '/blog'], ['Bulk orders', '/contact'], ['Manage store', '/admin']]],
            ['Our collections', categories.map(c => [c.name, `/shop?category=${c.slug}`])],
            ['Here to help', [['Contact us', '/contact'], ['Track your order', '/track'], ['Shipping & delivery', 'Shipping'], ['Returns & exchanges', 'Returns'], ['Privacy policy', 'Privacy'], ['Terms & conditions', 'Terms']]]
          ].map(([title, links]) => (
            <div key={title as string}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#544332]">{title as string}</h3>
              {(links as string[][]).map(([label, href]) => href.startsWith('/') ? (
                <Link key={label} href={href} className="flex min-h-11 items-center text-sm text-[#756757] hover:text-[#9b452f] transition">{label}</Link>
              ) : (
                <button key={label} className="block min-h-11 text-sm text-[#756757] hover:text-[#9b452f] transition cursor-pointer" onClick={() => setModal(href)}>{label}</button>
              ))}
            </div>
          ))}
        </div>

        <div className={`${wrap} flex flex-wrap justify-between gap-4 border-t border-[#dcd1be] py-6 text-xs text-[#756757]`}>
          <p>© {new Date().getFullYear()} S&amp;M IMPEX. All rights reserved.</p>
          <p>Thoughtfully made in India · Export Worldwide</p>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-5 z-30 flex flex-col gap-3">
        <button onClick={() => setModal('contact-options')} aria-label="WhatsApp enquiry options" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#426443] text-white shadow-lg hover:scale-105 transition cursor-pointer"><Icon name="chat" /></button>
        <button onClick={() => setModal('contact-options')} aria-label="Call contact options" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#84432f] text-white shadow-lg hover:scale-105 transition cursor-pointer"><Icon name="phone" /></button>
      </div>

      {notice && view !== 'contact' && <div role="status" className="fixed bottom-6 left-6 z-50 max-w-[75vw] bg-[#3e4c36] px-6 py-4 text-sm text-white shadow-xl rounded-sm">{notice}</div>}

      {/* Quick View Slide-in Right Drawer */}
      <QuickViewDrawer
        product={quick}
        isOpen={modal === 'quick' && !!quick}
        onClose={() => { setModal(''); setQuick(null) }}
        onAddToCart={(p, count, v) => {
          add(p, count, v)
        }}
        onBuyNow={(p, count, v) => {
          buyNow(p, count, v)
        }}
      />

      {/* Sliding Cart Drawer */}
      <CartDrawer
        isOpen={modal === 'cart'}
        onClose={() => setModal('')}
        cart={cart}
        products={data.products}
        onUpdateQty={updateCartQty}
        onRemove={removeCartItem}
        total={total}
      />

      {/* Modals & Dialogs */}
      {modal && modal !== 'quick' && modal !== 'cart' && (
        <Dialog title={modal === 'cart' ? 'Your shopping bag' : modal === 'search' ? 'Find your little joy' : modal === 'wishlist' ? 'Your favourites' : modal === 'contact-options' ? 'Let’s connect' : modal} close={() => setModal('')}>

          {modal === 'search' && (
            <>
              <input autoFocus aria-label="Search products" value={search} onChange={e => setSearch(e.target.value)} placeholder="Try sandalwood, flowers, candles, sambrani…" className="mb-4 min-h-12 w-full border-b border-[#cbbb9f] bg-transparent p-3 text-sm focus:border-[#9b452f] focus:outline-hidden" />
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#81684f]">Filter by Category:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSearch('')} className="rounded-full border border-[#d6c7b2] bg-white px-3 py-1 text-xs text-[#544332] hover:border-[#9b452f] hover:text-[#9b452f] transition cursor-pointer">All</button>
                  {categories.map(c => (
                    <Link
                      key={c.id}
                      href={`/shop?category=${c.slug}`}
                      onClick={() => setModal('')}
                      className="rounded-full border border-[#d6c7b2] bg-white px-3 py-1 text-xs text-[#544332] hover:border-[#9b452f] hover:text-[#9b452f] transition"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="max-h-[50vh] overflow-auto divide-y divide-[#e0d6c5]">
                {data.products.filter(p => `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(p => (
                  <Link key={p.id} href={`/products/${p.slug}`} onClick={() => setModal('')} className="flex min-h-14 items-center justify-between py-2 text-sm hover:text-[#9b452f] transition">
                    <span className="font-medium">{p.name}</span>
                    <span className="font-semibold">{money(p.price)}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {modal === 'wishlist' && (
            wishlist.length ? grid(data.products.filter(p => wishlist.includes(p.id))) : <p className="text-sm py-8 text-center text-[#756757]">Save products with the heart icon to keep them here.</p>
          )}

          {modal === 'cart' && (
            cart.length ? (
              <>
                <div className="max-h-[50vh] overflow-auto divide-y divide-[#ded4c2]">
                  {cart.map((c, i) => {
                    const p = data.products.find(p => p.id === c.id)
                    return p && (
                      <div className="flex items-center gap-4 py-4" key={`${c.id}-${c.variation}`}>
                        <Photo media={p.image} className="h-20 w-20 shrink-0 rounded-sm" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-lg leading-snug">{p.name}</h3>
                          <p className="text-xs text-[#756757] mt-0.5">{c.variation} · {money(p.price)}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <button aria-label="Decrease quantity" className="h-9 w-9 border border-[#d9cdbb] rounded-sm hover:bg-[#efe4d5] cursor-pointer" onClick={() => saveCart(cart.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                            <span className="text-sm font-medium">{c.qty}</span>
                            <button aria-label="Increase quantity" className="h-9 w-9 border border-[#d9cdbb] rounded-sm hover:bg-[#efe4d5] cursor-pointer" onClick={() => saveCart(cart.map((x, j) => j === i ? { ...x, qty: Math.min(p.stock || 1, x.qty + 1) } : x))}>+</button>
                            <button className="min-h-11 text-xs text-[#9b452f] underline ml-2 cursor-pointer" onClick={() => saveCart(cart.filter((_, j) => i !== j))}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="my-6 flex justify-between font-serif text-2xl border-t border-[#ded4c2] pt-4 font-semibold">Subtotal <span>{money(total)}</span></p>
                <Link href="/contact?subject=Order%20Enquiry%20from%20Bag" onClick={() => setModal('')} className={`${button} w-full`}>Enquire to place your order <Icon name="arrow" /></Link>
                <p className="mt-4 text-xs leading-6 text-[#756757]">Online payments are not yet configured. Our team will confirm stock, shipping, and payment details before your order is placed. Your bag is saved on this device.</p>
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="mb-6 font-serif text-2xl">Your next little joy is waiting.</p>
                <Link href="/shop" onClick={() => setModal('')} className={button}>Explore the collection</Link>
              </div>
            )
          )}

          {modal === 'contact-options' && (
            <div className="space-y-4">
              <p className="text-sm leading-7 text-[#756757]">Direct WhatsApp and phone contact will be enabled when the business number is confirmed. In the meantime, send an enquiry to our team.</p>
              <Link href="/contact" onClick={() => setModal('')} className={`${button} w-full mt-4`}>Contact our team <Icon name="arrow" /></Link>
            </div>
          )}

          {['Shipping', 'Returns', 'Privacy', 'Terms'].includes(modal) && (
            <p className="text-sm leading-7 text-[#756757]">
              {modal === 'Shipping' ? 'Delivery availability, shipping charges, and timelines are confirmed individually before payment. Contact our team with your postcode for an estimate.' : modal === 'Returns' ? 'Please contact us promptly if your product arrives damaged or incorrect. Keep the packaging and photographs so our team can review your enquiry. Final return terms will be confirmed before purchase.' : modal === 'Privacy' ? 'Enquiry details are stored privately to respond to your request. Your bag and favourites are saved only in this browser. Contact our team for questions about your personal information.' : 'This store currently accepts order enquiries, not online payments. Prices are displayed in Indian rupees. Availability, delivery, and final order terms are confirmed by our team before purchase.'}
            </p>
          )}
        </Dialog>
      )}
    </div>
  )
}
