/**
 * Nextcloud Deck MCP Tool Definitions
 * Universal CRUD tools for Deck entities
 */

import { z } from 'zod';

// ===== deck_create Tool =====

export const deckCreateTool = {
  name: 'deck_create',
  description: 'Create entity in Nextcloud Deck (board, stack, card, label, comment, attachment)',
  inputSchema: {
    entity: z.enum(['board', 'stack', 'card', 'label', 'comment', 'attachment']).describe('Type of entity to create'),
    data: z.record(z.any()).describe('Entity data (structure depends on entity type)'),
  },
};

// ===== deck_read Tool =====

export const deckReadTool = {
  name: 'deck_read',
  description: 'Read entities from Nextcloud Deck with optional filters (boards, stacks, cards, labels, comments, attachments)',
  inputSchema: {
    entity: z.enum(
      ['boards', 'board', 'stacks', 'stack', 'cards', 'card', 'labels', 'label', 'comments', 'attachments']
    ).describe('Entity type (plural for list, singular for specific item)'),
    params: z.record(z.any()).optional().describe('Filter parameters (id, boardId, stackId, search, etc.)'),
  },
};

// ===== deck_update Tool =====

export const deckUpdateTool = {
  name: 'deck_update',
  description: 'Update entity in Nextcloud Deck (board, stack, card, label)',
  inputSchema: {
    entity: z.enum(['board', 'stack', 'card', 'label']).describe('Entity type to update'),
    id: z.number().describe('Entity ID'),
    data: z.record(z.any()).describe('Updated fields'),
    boardId: z.number().optional().describe('Board ID (required for stack and label updates)'),
  },
};

// ===== deck_delete Tool =====

export const deckDeleteTool = {
  name: 'deck_delete',
  description: 'Delete entity from Nextcloud Deck (board, stack, card, label, comment, attachment)',
  inputSchema: {
    entity: z.enum(['board', 'stack', 'card', 'label', 'comment', 'attachment']).describe('Entity type to delete'),
    id: z.number().describe('Entity ID'),
    boardId: z.number().optional().describe('Board ID (required for stack and label deletion)'),
    cardId: z.number().optional().describe('Card ID (required for comment and attachment deletion)'),
  },
};

// ===== deck_action Tool =====

export const deckActionTool = {
  name: 'deck_action',
  description: 'Perform special actions on Deck entities (move, assign, archive, etc.)',
  inputSchema: {
    entity: z.enum(['card', 'stack']).describe('Entity type'),
    id: z.number().describe('Entity ID'),
    action: z.enum(
      ['move', 'assign', 'unassign', 'add_label', 'remove_label', 'archive', 'unarchive', 'reorder', 'mark_done', 'mark_undone']
    ).describe('Action to perform'),
    params: z.record(z.any()).optional().describe('Action parameters (stackId, userId, labelId, order, etc.)'),
  },
};

// ===== Export all tools =====

export const deckTools = [
  deckCreateTool,
  deckReadTool,
  deckUpdateTool,
  deckDeleteTool,
  deckActionTool,
];

// ===== Type exports for handlers =====

const deckCreateSchema = z.object(deckCreateTool.inputSchema);
const deckReadSchema = z.object(deckReadTool.inputSchema);
const deckUpdateSchema = z.object(deckUpdateTool.inputSchema);
const deckDeleteSchema = z.object(deckDeleteTool.inputSchema);
const deckActionSchema = z.object(deckActionTool.inputSchema);

export type DeckCreateArgs = z.infer<typeof deckCreateSchema>;
export type DeckReadArgs = z.infer<typeof deckReadSchema>;
export type DeckUpdateArgs = z.infer<typeof deckUpdateSchema>;
export type DeckDeleteArgs = z.infer<typeof deckDeleteSchema>;
export type DeckActionArgs = z.infer<typeof deckActionSchema>;
