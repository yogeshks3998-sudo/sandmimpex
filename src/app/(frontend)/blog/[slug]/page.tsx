import { getArticle, getStore } from '@/lib/store'
import { notFound } from 'next/navigation'
import Storefront from '../../storefront'
export async function generateStaticParams() { return (await getStore()).articles.map(p => ({ slug: p.slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug)
  if (!article) notFound()
  return <Storefront data={await getStore()} view="article" article={article} />
}
