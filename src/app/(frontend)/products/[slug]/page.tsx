import { getProduct, getStore } from '@/lib/store'
import { notFound } from 'next/navigation'
import Storefront from '../../storefront'
export async function generateStaticParams() { return (await getStore()).products.map(p => ({ slug: p.slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()
  return <Storefront data={await getStore()} view="product" product={product} />
}
