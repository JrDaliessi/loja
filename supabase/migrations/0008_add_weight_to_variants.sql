-- Adicionar a coluna de peso em gramas na tabela de variantes

alter table public.variants
add column weight_g integer not null default 100;

comment on column public.variants.weight_g is 'Peso da variação em gramas, usado para cálculo de frete.';
