import { unstable_cache } from 'next/cache'
import { getPayloadClient, findBySlug } from './payload'
import { sandmProducts, sandmCategories, sandmArticles, sandmHeroMedia } from './sandm-data'
import type { Product, Category, Article, Media } from '@/payload-types'

export const getStore = unstable_cache(async () => {
  try {
    const payload = await getPayloadClient()
    const [products, categories, articles, media] = await Promise.all([
      payload.find({ collection: 'products', limit: 100, depth: 2, overrideAccess: false, sort: 'createdAt' }),
      payload.find({ collection: 'categories', limit: 20, depth: 1, overrideAccess: false, sort: 'createdAt' }),
      payload.find({ collection: 'articles', limit: 12, depth: 1, overrideAccess: false }),
      payload.find({ collection: 'media', limit: 1, overrideAccess: false }),
    ])
    if (products.docs.length > 0) {
      return {
        products: products.docs as Product[],
        categories: sandmCategories,
        articles: (articles.docs.length > 0 ? articles.docs : sandmArticles) as Article[],
        hero: (media.docs[0] || sandmHeroMedia) as Media,
      }
    }
  } catch {
    // If Payload is not connected or in local dev without Figma Cloud credentials
  }

  return {
    products: sandmProducts,
    categories: sandmCategories,
    articles: sandmArticles,
    hero: sandmHeroMedia,
  }
}, ['store-data-v8'], { tags: ['store'] })

export const getProduct = unstable_cache(async (slug: string) => {
  try {
    const doc = await findBySlug('products', slug)
    if (doc) return doc as Product
  } catch {}
  return sandmProducts.find(p => p.slug === slug) ?? null
}, ['product-detail-v8'], { tags: ['store'] })

export const getArticle = unstable_cache(async (slug: string) => {
  try {
    const doc = await findBySlug('articles', slug)
    if (doc) return doc as Article
  } catch {}
  return sandmArticles.find(a => a.slug === slug) ?? null
}, ['article-detail-v6'], { tags: ['store'] })
