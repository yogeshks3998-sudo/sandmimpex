import { getStore } from '@/lib/store'
import Storefront from '../storefront'
export default async function Page() { return <Storefront data={await getStore()} view="blog" /> }
