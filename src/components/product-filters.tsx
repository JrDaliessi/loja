'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const currentPriceRange = searchParams.get('preco') || '';
    let [min, max] = currentPriceRange.split('-').map(Number);

    if (type === 'min') {
      min = Number(value);
    } else {
      max = Number(value);
    }

    const newPriceRange = `${isNaN(min) ? '' : min}-${isNaN(max) ? '' : max}`;
    router.push(`?${createQueryString('preco', newPriceRange)}`);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Filtro de Tamanho */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="tamanho">Tamanho</Label>
        <Select onValueChange={(value) => handleFilterChange('tamanho', value)} value={searchParams.get('tamanho') || ''}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="P">P</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="G">G</SelectItem>
            <SelectItem value="GG">GG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro de Cor */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="cor">Cor</Label>
        <Select onValueChange={(value) => handleFilterChange('cor', value)} value={searchParams.get('cor') || ''}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a cor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="preto">Preto</SelectItem>
            <SelectItem value="branco">Branco</SelectItem>
            <SelectItem value="vermelho">Vermelho</SelectItem>
            <SelectItem value="azul">Azul</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro de Preço */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="preco">Preço</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="w-[80px]"
            value={searchParams.get('preco')?.split('-')[0] || ''}
            onChange={(e) => handlePriceChange('min', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            className="w-[80px]"
            value={searchParams.get('preco')?.split('-')[1] || ''}
            onChange={(e) => handlePriceChange('max', e.target.value)}
          />
        </div>
      </div>

      {/* Ordenação */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ordenar">Ordenar por</Label>
        <Select onValueChange={(value) => handleFilterChange('ordenar', value)} value={searchParams.get('ordenar') || ''}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mais-vendidos">Mais Vendidos</SelectItem>
            <SelectItem value="menor-preco">Menor Preço</SelectItem>
            <SelectItem value="maior-preco">Maior Preço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botão para limpar filtros */}
      <div className="flex items-end">
        <Button variant="outline" onClick={() => router.push(window.location.pathname)}>
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
}
