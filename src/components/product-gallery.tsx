'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/app/p/[slug]/page'

interface ProductGalleryProps {
  images: ProductImage[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0] || null)

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-200 aspect-square w-full rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Sem imagem</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square w-full relative rounded-lg overflow-hidden border">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || 'Imagem do Produto'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className={cn(
              'aspect-square w-full relative rounded-md overflow-hidden border-2',
              selectedImage.id === image.id
                ? 'border-blue-500'
                : 'border-transparent'
            )}
          >
            <Image
              src={image.url}
              alt={image.alt || 'Thumbnail da imagem do produto'}
              fill
              className="object-cover"
              sizes="20vw"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
