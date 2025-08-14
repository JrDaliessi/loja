'use client';

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFormProps {
  initialQuery?: string;
}

export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
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
    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
      <Input
        type="text"
        name="query"
        placeholder="Buscar produtos..."
        defaultValue={initialQuery}
        className="flex-1"
      />
      <Button type="submit">Buscar</Button>
    </form>
  );
}

