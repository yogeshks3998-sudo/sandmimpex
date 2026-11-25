import type { CollectionConfig, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

const changed: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  revalidateTag('store', { expire: 0 })
  for (const slug of [doc.slug, previousDoc?.slug].filter(Boolean)) {
    revalidatePath(`/products/${slug}`)
    revalidatePath(`/blog/${slug}`)
  }
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/blog')
  return doc
}
const deleted: CollectionAfterDeleteHook = ({ doc }) => { changed({ doc, previousDoc: doc } as Parameters<CollectionAfterChangeHook>[0]); return doc }
const staff = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const editorial = {
  access: { read: () => true, create: staff, update: staff, delete: staff },
  hooks: { afterChange: [changed], afterDelete: [deleted] },
}
export const Categories: CollectionConfig = {
  slug: 'categories', ...editorial, admin: { useAsTitle: 'name', group: 'Shop' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name' },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}
export const Products: CollectionConfig = {
  slug: 'products', ...editorial, admin: { useAsTitle: 'name', group: 'Shop' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name' },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media' }] },
    { name: 'description', type: 'textarea' },
    { name: 'price', type: 'number', min: 0, required: true },
    { name: 'originalPrice', type: 'number', min: 0 },
    { name: 'stock', type: 'number', min: 0, defaultValue: 20 },
    { name: 'fragrance', type: 'text' },
    { name: 'colour', type: 'text' },
    { name: 'type', type: 'text' },
    { name: 'badge', type: 'text' },
    { name: 'size', type: 'text' },
    { name: 'specifications', type: 'array', fields: [{ name: 'label', type: 'text' }, { name: 'value', type: 'text' }] },
    { name: 'variations', type: 'array', fields: [{ name: 'label', type: 'text' }] },
  ],
}
export const Articles: CollectionConfig = {
  slug: 'articles', ...editorial, admin: { useAsTitle: 'title', group: 'Journal' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'textarea' },
  ],
}
export const Enquiries: CollectionConfig = {
  slug: 'enquiries', admin: { useAsTitle: 'name', group: 'Customer care' },
  access: { create: () => true, read: staff, update: staff, delete: staff },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 100 },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', maxLength: 25 },
    { name: 'subject', type: 'text', required: true, maxLength: 150 },
    { name: 'message', type: 'textarea', required: true, maxLength: 5000 },
    { name: 'status', type: 'select', options: ['new', 'resolved'], defaultValue: 'new', access: { create: staff, update: staff } },
  ],
}
