import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleApi } from '@/api/example';
import type { ExampleData } from '@/types/example';

export const useExamples = () => {
  return useQuery({
    queryKey: ['examples'],
    queryFn: exampleApi.getAll,
  });
};

export const useExample = (id: string) => {
  return useQuery({
    queryKey: ['examples', id],
    queryFn: () => exampleApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ExampleData, 'id'>) => exampleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
    },
  });
};

export const useUpdateExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExampleData> }) =>
      exampleApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
      queryClient.invalidateQueries({ queryKey: ['examples', variables.id] });
    },
  });
};

export const useDeleteExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exampleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
    },
  });
};
