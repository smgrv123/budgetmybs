import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCustomCategories,
  getPredefinedCategories,
  seedCategories,
  updateCategory,
} from '@/db';
import type { UpdateCategoryInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

/**
 * Hook for categories queries and mutations
 */
export const useCategories = () => {
  const queryClient = useQueryClient();

  const allCategoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'all'],
    queryFn: () => getAllCategories(),
  });

  const predefinedCategoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'predefined'],
    queryFn: () => getPredefinedCategories(),
  });

  const customCategoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, 'custom'],
    queryFn: () => getCustomCategories(),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const seedCategoryMutation = useMutation({
    mutationFn: seedCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  return {
    // Query state
    allCategories: allCategoriesQuery.data ?? [],
    predefinedCategories: predefinedCategoriesQuery.data ?? [],
    customCategories: customCategoriesQuery.data ?? [],
    isCategoriesLoading: allCategoriesQuery.isLoading,
    isCategoriesError: allCategoriesQuery.isError,
    categoriesError: allCategoriesQuery.error,
    refetchCategories: allCategoriesQuery.refetch,

    // Mutations
    createCategory: createMutation.mutate,
    createCategoryAsync: createMutation.mutateAsync,
    isCreatingCategory: createMutation.isPending,

    updateCategory: updateMutation.mutate,
    updateCategoryAsync: updateMutation.mutateAsync,
    isUpdatingCategory: updateMutation.isPending,

    removeCategory: deleteMutation.mutate,
    removeCategoryAsync: deleteMutation.mutateAsync,
    isRemovingCategory: deleteMutation.isPending,

    // seed
    seedCategory: seedCategoryMutation.mutate,
    seedCategoryAsync: seedCategoryMutation.mutateAsync,
    isSeedingCategory: seedCategoryMutation.isPending,
    seedCategoryError: seedCategoryMutation.error,
  };
};
