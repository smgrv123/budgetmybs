import { desc, eq } from 'drizzle-orm';

import { db } from '../client';
import { chatMessagesTable } from '../schema';
import type { CreateChatMessageInput } from '../schema-types';
import type { ChatActionStatus } from '../types';

// ============================================
// GET CHAT MESSAGES (paginated, oldest first — correct for FlatList rendering)
// ============================================

export const getChatMessages = async (limit = 50, offset = 0) => {
  const rows = await db
    .select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.reverse();
};

// ============================================
// GET CHAT MESSAGE BY ID
// ============================================

export const getChatMessageById = async (id: string) => {
  const result = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, id)).limit(1);
  return result[0] ?? null;
};

// ============================================
// CREATE CHAT MESSAGE
// ============================================

export const createChatMessage = async (data: CreateChatMessageInput) => {
  const result = await db
    .insert(chatMessagesTable)
    .values({
      ...data,
      actionType: data.actionType ?? null,
      actionData: data.actionData ?? null,
      actionStatus: data.actionStatus ?? null,
      quotedMessageId: data.quotedMessageId ?? null,
    })
    .returning();
  return result[0];
};

// ============================================
// UPDATE CHAT MESSAGE ACTION STATUS
// ============================================

export const updateChatMessageAction = async (id: string, actionStatus: ChatActionStatus) => {
  const result = await db
    .update(chatMessagesTable)
    .set({ actionStatus })
    .where(eq(chatMessagesTable.id, id))
    .returning();
  return result[0];
};

// ============================================
// REPLACE CHAT MESSAGE CONTENT
// Updates content + actionStatus in one write — used for the single-message pattern.
// ============================================

export const replaceChatMessageContent = async (
  id: string,
  content: string,
  actionStatus: ChatActionStatus
) => {
  const result = await db
    .update(chatMessagesTable)
    .set({ content, actionStatus })
    .where(eq(chatMessagesTable.id, id))
    .returning();
  return result[0];
};

// ============================================
// CLEAR CHAT HISTORY
// ============================================

export const clearChatHistory = async () => {
  await db.delete(chatMessagesTable);
};

// ============================================
// GET RECENT N MESSAGES (for Gemini context)
// ============================================

export const getRecentChatMessages = async (limit = 15) => {
  const rows = await db.select().from(chatMessagesTable).orderBy(desc(chatMessagesTable.createdAt)).limit(limit);
  // Return in chronological order for the LLM
  return rows.reverse();
};
