import { clearChatHistory, createChatMessage, getChatMessages, replaceChatMessageContent, updateChatMessageAction } from '@/db';
import type { CreateChatMessageInput } from '@/db/schema-types';
import type { ChatActionStatus } from '@/db/types';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const CHAT_MESSAGES_QUERY_KEY = ['chat', 'messages'] as const;

const PAGE_SIZE = 30;

/**
 * Hook for chat message queries and mutations.
 * Uses useInfiniteQuery for paginated loading of message history.
 */
export const useChat = () => {
  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────

  const messagesQuery = useInfiniteQuery({
    queryKey: CHAT_MESSAGES_QUERY_KEY,
    queryFn: ({ pageParam = 0 }) => getChatMessages(PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const sendMessageMutation = useMutation({
    mutationFn: (data: CreateChatMessageInput) => createChatMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, actionStatus }: { id: string; actionStatus: ChatActionStatus }) =>
      updateChatMessageAction(id, actionStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update action:', error);
    },
  });

  const replaceMessageMutation = useMutation({
    mutationFn: ({ id, content, actionStatus }: { id: string; content: string; actionStatus: ChatActionStatus }) =>
      replaceChatMessageContent(id, content, actionStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to replace message:', error);
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: clearChatHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to clear history:', error);
    },
  });

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    // Each page comes back ascending (oldest→newest). Reverse each page individually
    // so newest message is at index 0 (required for inverted FlatList), then concat pages
    // in order so older pages follow newer ones: [newest…30th, 31st…60th, …]
    messages: messagesQuery.data?.pages.flatMap((page) => [...page].reverse()) ?? [],
    isMessagesLoading: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,
    refetchMessages: messagesQuery.refetch,

    // Pagination
    fetchNextPage: messagesQuery.fetchNextPage,
    hasNextPage: messagesQuery.hasNextPage ?? false,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,

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

    // Replace message content + status in one write (single-message pattern)
    replaceMessage: replaceMessageMutation.mutate,
    replaceMessageAsync: replaceMessageMutation.mutateAsync,
    isReplacingMessage: replaceMessageMutation.isPending,

    // Clear all history
    clearHistory: clearHistoryMutation.mutate,
    clearHistoryAsync: clearHistoryMutation.mutateAsync,
    isClearingHistory: clearHistoryMutation.isPending,
  };
};
