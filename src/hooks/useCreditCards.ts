import {
  archiveCreditCard,
  createCreditCard,
  createCreditCardPayment,
  deleteCreditCard,
  getCreditCardLinkedTransactionCount,
  getCreditCardSummaries,
  getCreditCards,
  unarchiveCreditCard,
  updateCreditCard,
} from '@/db';
import type { CreateCreditCardPaymentInput, UpdateCreditCardInput } from '@/db/schema-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EXPENSES_QUERY_KEY,
  TOTAL_SPENT_QUERY_KEY,
  CREDIT_CARDS_QUERY_KEY,
  CREDIT_CARD_SUMMARIES_QUERY_KEY,
} from './queryKeys';

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

  const archiveMutation = useMutation({
    mutationFn: archiveCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to archive credit card:', error);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: unarchiveCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to unarchive credit card:', error);
    },
  });

  const payBillMutation = useMutation({
    mutationFn: ({ data, description }: { data: CreateCreditCardPaymentInput; description: string }) =>
      createCreditCardPayment(data, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_SUMMARIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOTAL_SPENT_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to record credit card payment:', error);
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

    archiveCreditCard: archiveMutation.mutate,
    archiveCreditCardAsync: archiveMutation.mutateAsync,
    isArchivingCreditCard: archiveMutation.isPending,

    unarchiveCreditCard: unarchiveMutation.mutate,
    unarchiveCreditCardAsync: unarchiveMutation.mutateAsync,
    isUnarchivingCreditCard: unarchiveMutation.isPending,

    getLinkedTransactionCount: getCreditCardLinkedTransactionCount,

    payBill: payBillMutation.mutate,
    payBillAsync: payBillMutation.mutateAsync,
    isPayingBill: payBillMutation.isPending,
  };
};
