import { Suspense } from 'react';
import { ProductList } from '@/components/product-list';
import { ProductFilters } from '@/components/product-filters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SearchPage({
  searchParams,
}: SearchPageProps) {
  const router = useRouter();
  const searchTerm = searchParams.get('q') || '';

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('query');
    if (query) {
      router.push(`/busca?q=${query}`);
    } else {
      router.push('/busca');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Busca de Produtos</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          type="text"
          name="query"
          placeholder="Buscar produtos..."
          defaultValue={searchTerm}
          className="flex-1"
        />
        <Button type="submit">Buscar</Button>
      </form>

      <ProductFilters />

      <Suspense fallback={<div>Carregando resultados da busca...</div>}>
        <ProductList searchParams={{ ...searchParams, q: searchTerm }} />
      </Suspense>
    </div>
  );
}
