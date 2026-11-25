'use client'

import { figmaNextImageLoader } from '@payloadcms/figma/next-image-loader'

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('/api/') || src.startsWith('http://') || src.startsWith('https://')) {
    return figmaNextImageLoader({ src, width, quality })
  }
  return `${src}?w=${width}&q=${quality || 75}`
}
