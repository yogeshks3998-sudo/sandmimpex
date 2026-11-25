import { Suspense } from 'react'
import { getStore } from '@/lib/store'
import Storefront from '../../storefront'

export default async function Page() {
  const data = await getStore()
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfaf7]" />}>
      <Storefront data={data} view="checkout-confirmation" />
    </Suspense>
  )
}
