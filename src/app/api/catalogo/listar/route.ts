import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = createClient();

  // Parâmetros de filtro
  const categorySlug = searchParams.get('category_slug');
  const sizes = searchParams.get('tamanho')?.split(',');
  const colors = searchParams.get('cor')?.split(',');
  const priceRange = searchParams.get('preco'); // Formato: min-max
  const sortBy = searchParams.get('ordenar');
  const searchTerm = searchParams.get('q'); // Novo parâmetro de busca

  // Parâmetros de paginação
  const page = parseInt(searchParams.get('pagina') || '1', 10);
  const limit = parseInt(searchParams.get('limite') || '10', 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let productsQuery = supabase.from('products').select('*, variants(*)');
    let countQuery = supabase.from('products').select('count', { count: 'exact' });

    // Aplicar filtro de busca por texto livre
    if (searchTerm) {
      productsQuery = productsQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Aplicar filtros a ambas as queries
    if (categorySlug) {
      productsQuery = productsQuery.eq('category_slug', categorySlug);
      countQuery = countQuery.eq('category_slug', categorySlug);
    }

    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      if (!isNaN(minPrice)) {
        productsQuery = productsQuery.gte('price', minPrice);
        countQuery = countQuery.gte('price', minPrice);
      }
      if (!isNaN(maxPrice)) {
        productsQuery = productsQuery.lte('price', maxPrice);
        countQuery = countQuery.lte('price', maxPrice);
      }
    }

    // Filtros para variantes (tamanho e cor)
    // Nota: Isso assume que 'variants' é uma tabela relacionada e que os filtros devem ser aplicados a ela.
    // Se a estrutura do banco de dados for diferente, esta lógica precisará ser ajustada.
    if (sizes && sizes.length > 0) {
      productsQuery = productsQuery.in('variants.size', sizes);
      countQuery = countQuery.in('variants.size', sizes);
    }
    if (colors && colors.length > 0) {
      productsQuery = productsQuery.in('variants.color', colors);
      countQuery = countQuery.in('variants.color', colors);
    }

    // Aplicar ordenação (apenas na query de produtos)
    if (sortBy) {
      switch (sortBy) {
        case 'mais-vendidos':
          productsQuery = productsQuery.order('name', { ascending: true }); // Exemplo
          break;
        case 'menor-preco':
          productsQuery = productsQuery.order('price', { ascending: true });
          break;
        case 'maior-preco':
          productsQuery = productsQuery.order('price', { ascending: false });
          break;
        default:
          productsQuery = productsQuery.order('name', { ascending: true }); // Padrão
      }
    } else {
      productsQuery = productsQuery.order('name', { ascending: true }); // Padrão se não houver ordenação
    }

    // Aplicar paginação (apenas na query de produtos)
    productsQuery = productsQuery.range(from, to);

    const [{ data: products, error: productsError }, { count: totalCount, error: countError }] = await Promise.all([
      productsQuery,
      countQuery,
    ]);

    if (productsError) {
      console.error('Erro ao buscar produtos:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (countError) {
      console.error('Erro ao contar produtos:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    return NextResponse.json({
      products: products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
      },
    });
  } catch (error: any) {
    console.error('Erro inesperado no endpoint de catálogo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

