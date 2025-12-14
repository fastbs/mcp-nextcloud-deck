/**
 * Nextcloud Deck MCP Tool Handlers
 * Implements business logic for Deck CRUD operations
 */

import { DeckClient } from './deck-client.js';
import type {
  DeckCreateArgs,
  DeckReadArgs,
  DeckUpdateArgs,
  DeckDeleteArgs,
  DeckActionArgs,
} from './deck-tools.js';
import type {
  CreateBoardData,
  CreateStackData,
  CreateCardData,
  CreateLabelData,
  CreateCommentData,
  CreateAttachmentData,
  UpdateBoardData,
  UpdateStackData,
  UpdateCardData,
  UpdateLabelData,
} from './types.js';

/**
 * Create DeckClient instance from environment variables
 */
function createDeckClient(): DeckClient {
  const baseUrl = process.env.NEXTCLOUD_URL;
  const username = process.env.NEXTCLOUD_USERNAME;
  const password = process.env.NEXTCLOUD_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error(
      'Missing Nextcloud credentials. Please set NEXTCLOUD_URL, NEXTCLOUD_USERNAME, and NEXTCLOUD_PASSWORD environment variables.'
    );
  }

  return new DeckClient({
    baseUrl,
    username,
    password,
  });
}

/**
 * Handle deck_create tool
 */
export async function handleDeckCreate(args: DeckCreateArgs): Promise<any> {
  const client = createDeckClient();

  switch (args.entity) {
    case 'board':
      return await client.createBoard(args.data as CreateBoardData);

    case 'stack':
      return await client.createStack(args.data as CreateStackData);

    case 'card':
      return await client.createCard(args.data as CreateCardData);

    case 'label':
      return await client.createLabel(args.data as CreateLabelData);

    case 'comment':
      return await client.createComment(args.data as CreateCommentData);

    case 'attachment':
      return await client.createAttachment(args.data as CreateAttachmentData);

    default:
      throw new Error(`Unknown entity type: ${args.entity}`);
  }
}

/**
 * Handle deck_read tool
 */
export async function handleDeckRead(args: DeckReadArgs): Promise<any> {
  const client = createDeckClient();
  const params = args.params || {};

  switch (args.entity) {
    // ===== Boards =====
    case 'boards':
      return await client.getBoards();

    case 'board':
      if (!params.id) {
        throw new Error('Board ID is required');
      }
      return await client.getBoard(params.id);

    // ===== Stacks =====
    case 'stacks':
      if (!params.boardId) {
        throw new Error('Board ID is required to get stacks');
      }
      return await client.getStacks(params.boardId);

    case 'stack':
      if (!params.boardId || !params.id) {
        throw new Error('Board ID and Stack ID are required');
      }
      return await client.getStack(params.boardId, params.id);

    // ===== Cards =====
    case 'cards':
      if (params.stackId) {
        return await client.getCards(params.stackId);
      }
      // If no stackId, search across board
      if (params.boardId) {
        const stacks = await client.getStacks(params.boardId);
        const allCards = [];
        for (const stack of stacks) {
          const cards = await client.getCards(stack.id);
          allCards.push(...cards);
        }
        // Apply filters
        let filtered = allCards;
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          filtered = filtered.filter(
            c => c.title.toLowerCase().includes(searchLower) ||
                 c.description?.toLowerCase().includes(searchLower)
          );
        }
        if (params.archived !== undefined) {
          filtered = filtered.filter(c => c.archived === params.archived);
        }
        if (params.done !== undefined) {
          filtered = filtered.filter(c => c.done === params.done);
        }
        return filtered;
      }
      throw new Error('Either stackId or boardId is required to get cards');

    case 'card':
      if (!params.id) {
        throw new Error('Card ID is required');
      }
      return await client.getCard(params.id);

    // ===== Labels =====
    case 'labels':
      if (!params.boardId) {
        throw new Error('Board ID is required to get labels');
      }
      return await client.getLabels(params.boardId);

    case 'label':
      if (!params.boardId || !params.id) {
        throw new Error('Board ID and Label ID are required');
      }
      const labels = await client.getLabels(params.boardId);
      const label = labels.find(l => l.id === params.id);
      if (!label) {
        throw new Error(`Label ${params.id} not found`);
      }
      return label;

    // ===== Comments =====
    case 'comments':
      if (!params.cardId) {
        throw new Error('Card ID is required to get comments');
      }
      return await client.getComments(params.cardId);

    // ===== Attachments =====
    case 'attachments':
      if (!params.cardId) {
        throw new Error('Card ID is required to get attachments');
      }
      return await client.getAttachments(params.cardId);

    default:
      throw new Error(`Unknown entity type: ${args.entity}`);
  }
}

/**
 * Handle deck_update tool
 */
export async function handleDeckUpdate(args: DeckUpdateArgs): Promise<any> {
  const client = createDeckClient();

  switch (args.entity) {
    case 'board':
      return await client.updateBoard(args.id, args.data as UpdateBoardData);

    case 'stack':
      if (!args.boardId) {
        throw new Error('Board ID is required to update stack');
      }
      return await client.updateStack(args.boardId, args.id, args.data as UpdateStackData);

    case 'card':
      return await client.updateCard({ ...(args.data as UpdateCardData), cardId: args.id });

    case 'label':
      if (!args.boardId) {
        throw new Error('Board ID is required to update label');
      }
      return await client.updateLabel(args.boardId, args.id, args.data as UpdateLabelData);

    default:
      throw new Error(`Unknown entity type: ${args.entity}`);
  }
}

/**
 * Handle deck_delete tool
 */
export async function handleDeckDelete(args: DeckDeleteArgs): Promise<{ success: boolean; message: string }> {
  const client = createDeckClient();

  switch (args.entity) {
    case 'board':
      await client.deleteBoard(args.id);
      return { success: true, message: `Board ${args.id} deleted` };

    case 'stack':
      if (!args.boardId) {
        throw new Error('Board ID is required to delete stack');
      }
      await client.deleteStack(args.boardId, args.id);
      return { success: true, message: `Stack ${args.id} deleted` };

    case 'card':
      await client.deleteCard(args.id);
      return { success: true, message: `Card ${args.id} deleted` };

    case 'label':
      if (!args.boardId) {
        throw new Error('Board ID is required to delete label');
      }
      await client.deleteLabel(args.boardId, args.id);
      return { success: true, message: `Label ${args.id} deleted` };

    case 'comment':
      if (!args.cardId) {
        throw new Error('Card ID is required to delete comment');
      }
      await client.deleteComment(args.cardId, args.id);
      return { success: true, message: `Comment ${args.id} deleted` };

    case 'attachment':
      if (!args.cardId) {
        throw new Error('Card ID is required to delete attachment');
      }
      await client.deleteAttachment(args.cardId, args.id);
      return { success: true, message: `Attachment ${args.id} deleted` };

    default:
      throw new Error(`Unknown entity type: ${args.entity}`);
  }
}

/**
 * Handle deck_action tool
 */
export async function handleDeckAction(args: DeckActionArgs): Promise<any> {
  const client = createDeckClient();
  const params = args.params || {} as any;

  return await client.performAction(
    args.entity as 'card' | 'stack',
    args.id,
    args.action,
    params
  );
}

/**
 * Export all handlers
 */
export const deckHandlers = {
  deck_create: handleDeckCreate,
  deck_read: handleDeckRead,
  deck_update: handleDeckUpdate,
  deck_delete: handleDeckDelete,
  deck_action: handleDeckAction,
};
