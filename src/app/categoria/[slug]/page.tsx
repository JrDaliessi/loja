import { Suspense } from 'react';
import { ProductList } from '@/components/product-list';
import { ProductFilters } from '@/components/product-filters';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const categorySlug = params.slug;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 capitalize">{categorySlug.replace(/-/g, ' ')}</h1>
      <ProductFilters />
      <Suspense fallback={<div>Carregando produtos...</div>}>
        <ProductList categorySlug={categorySlug} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
