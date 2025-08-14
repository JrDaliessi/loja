import { Suspense } from 'react';
import { ProductList } from '@/components/product-list';
import { ProductFilters } from '@/components/product-filters';
import { SearchForm } from '@/components/search-form';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const searchTerm = typeof searchParams.q === 'string' ? searchParams.q : '';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Busca de Produtos</h1>

      <SearchForm initialQuery={searchTerm} />

      <ProductFilters />

      <Suspense fallback={<div>Carregando resultados da busca...</div>}>
        <ProductList searchParams={{ ...searchParams, q: searchTerm }} />
      </Suspense>
    </div>
  );
}
