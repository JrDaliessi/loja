-- Tabela para armazenar em cache as cotações de frete

create table public.shipping_quotes (
  -- Usamos o CEP e o peso como identificadores do cache
  cep text not null,
  total_weight_g integer not null,

  -- O conteúdo da cotação, armazenado como JSON
  quotes jsonb not null,

  -- Data de criação para controlar a expiração do cache (30 min)
  created_at timestamptz not null default now(),

  -- Chave primária composta
  primary key (cep, total_weight_g)
);

comment on table public.shipping_quotes is 'Armazena em cache as cotações de frete para evitar chamadas repetidas à API externa.';
