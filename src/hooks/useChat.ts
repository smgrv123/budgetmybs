import { clearChatHistory, createChatMessage, getChatMessages, updateChatMessageAction } from '@/db';
import type { CreateChatMessageInput } from '@/db/schema-types';
import type { ChatActionStatus } from '@/db/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const CHAT_MESSAGES_QUERY_KEY = ['chat', 'messages'] as const;

/**
 * Hook for chat message queries and mutations.
 * Follows the same pattern as useExpenses, useDebts, etc.
 */
export const useChat = (limit = 50) => {
  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────

  const messagesQuery = useQuery({
    queryKey: [...CHAT_MESSAGES_QUERY_KEY, { limit }],
    queryFn: () => getChatMessages(limit),
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const sendMessageMutation = useMutation({
    mutationFn: (data: CreateChatMessageInput) => createChatMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, actionStatus }: { id: string; actionStatus: ChatActionStatus }) =>
      updateChatMessageAction(id, actionStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: clearChatHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
  });

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    // Query state
    messages: messagesQuery.data ?? [],
    isMessagesLoading: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,
    refetchMessages: messagesQuery.refetch,

    // Send a message (user or assistant)
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessageError: sendMessageMutation.error,

    // Update action status (pending → completed / cancelled)
    updateAction: updateActionMutation.mutate,
    updateActionAsync: updateActionMutation.mutateAsync,
    isUpdatingAction: updateActionMutation.isPending,
    updateActionError: updateActionMutation.error,

    // Clear all history
    clearHistory: clearHistoryMutation.mutate,
    clearHistoryAsync: clearHistoryMutation.mutateAsync,
    isClearingHistory: clearHistoryMutation.isPending,
  };
};
