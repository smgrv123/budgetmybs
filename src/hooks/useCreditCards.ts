import { createCreditCard, deleteCreditCard, getCreditCardSummaries, getCreditCards, updateCreditCard } from '@/db';
import type { UpdateCreditCardInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CREDIT_CARDS_QUERY_KEY = ['creditCards'] as const;
export const CREDIT_CARD_SUMMARIES_QUERY_KEY = ['creditCards', 'summaries'] as const;

export const useCreditCards = (activeOnly = true) => {
  const queryClient = useQueryClient();

  const creditCardsQuery = useQuery({
    queryKey: [...CREDIT_CARDS_QUERY_KEY, { activeOnly }],
    queryFn: () => getCreditCards(activeOnly),
  });

  const summariesQuery = useQuery({
    queryKey: [...CREDIT_CARD_SUMMARIES_QUERY_KEY, { activeOnly }],
    queryFn: () => getCreditCardSummaries(activeOnly),
  });

  const createMutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCreditCardInput }) => updateCreditCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
  });

  return {
    creditCards: creditCardsQuery.data ?? [],
    creditCardSummaries: summariesQuery.data ?? [],

    isCreditCardsLoading: creditCardsQuery.isLoading,
    isCreditCardsError: creditCardsQuery.isError,
    creditCardsError: creditCardsQuery.error,
    refetchCreditCards: creditCardsQuery.refetch,

    isCreditCardSummariesLoading: summariesQuery.isLoading,
    isCreditCardSummariesError: summariesQuery.isError,
    creditCardSummariesError: summariesQuery.error,
    refetchCreditCardSummaries: summariesQuery.refetch,

    createCreditCard: createMutation.mutate,
    createCreditCardAsync: createMutation.mutateAsync,
    isCreatingCreditCard: createMutation.isPending,

    updateCreditCard: updateMutation.mutate,
    updateCreditCardAsync: updateMutation.mutateAsync,
    isUpdatingCreditCard: updateMutation.isPending,

    removeCreditCard: deleteMutation.mutate,
    removeCreditCardAsync: deleteMutation.mutateAsync,
    isRemovingCreditCard: deleteMutation.isPending,
  };
};
