import { getStore } from '@/lib/store'
import Storefront from '../storefront'

export default async function Page() {
  const data = await getStore()
  return <Storefront data={data} view="track" />
}
