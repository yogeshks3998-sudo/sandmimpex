import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'
import { revalidateTag } from 'next/cache'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    createFolderField({ relationTo: 'folders' }),
    createTagField({ relationTo: 'tags' }),
  ],
  hooks: {
    afterChange: [({ doc }) => { revalidateTag('store', { expire: 0 }); return doc }],
    afterDelete: [({ doc }) => { revalidateTag('store', { expire: 0 }); return doc }],
  },
  upload: {
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      return headers
    },
  },
}
