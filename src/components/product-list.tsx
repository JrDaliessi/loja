import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';

interface ProductListProps {
  categorySlug?: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ProductList({ categorySlug, searchParams }: ProductListProps) {
  const currentSearchParams = new URLSearchParams(searchParams as Record<string, string>);

  // Adiciona o categorySlug aos searchParams se existir
  if (categorySlug) {
    currentSearchParams.set('category_slug', categorySlug);
  }

  // Constrói a URL da API com base nos searchParams
  const apiUrl = `/api/catalogo/listar?${currentSearchParams.toString()}`;

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', categorySlug, currentSearchParams.toString()],
    queryFn: async () => {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Carregando produtos...</div>;
  }

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  if (!data || data.products.length === 0) {
    return <div>Nenhum produto encontrado.</div>;
  }

  const { products, pagination } = data;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <div key={product.id} className="border p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-600">R$ {product.price?.toFixed(2)}</p>
            {/* Exibir variantes se houver */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                Variantes: {product.variants.map((v: any) => `${v.size}/${v.color}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
      )}
    </>
  );
}
