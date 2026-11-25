import { Suspense } from 'react'
import { getStore } from '@/lib/store'
import Storefront from '../storefront'

export default async function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfaf7]" />}>
      <Storefront data={await getStore()} view="shop" />
    </Suspense>
  )
}
