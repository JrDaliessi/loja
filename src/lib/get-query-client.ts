import { QueryClient } from '@tanstack/react-query';

// Função para criar uma nova instância de QueryClient para cada requisição no servidor
export const getQueryClient = () => new QueryClient();
